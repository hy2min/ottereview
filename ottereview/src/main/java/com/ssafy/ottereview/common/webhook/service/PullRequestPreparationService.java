package com.ssafy.ottereview.common.webhook.service;

import com.ssafy.ottereview.common.webhook.dto.DiffHunk;
import com.ssafy.ottereview.common.webhook.dto.FileChangeInfo;
import com.ssafy.ottereview.common.webhook.dto.PullRequestData;
import com.ssafy.ottereview.common.webhook.dto.PushEventInfo;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHCommit;
import org.kohsuke.github.GHCompare.Commit;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class PullRequestPreparationService {

    private final GithubApiClient githubApiClient;
    private final GitHubDiffService diffService;
    private final RepoRepository repository;

    public void preparePullRequestCreation(PushEventInfo pushInfo) {
        try {
            log.info("Preparing PR creation for branch: {}", pushInfo.getBranchName());

            // installationId가 필요하므로 pushInfo에 추가하거나 별도로 조회
            Long installationId = getInstallationId(pushInfo.getRepoId());

            // 1. 커밋 정보 수집
            List<Commit> commits = githubApiClient.getCommits(
                    installationId,
                    pushInfo.getRepoFullName(),
                    pushInfo.getBeforeSha(),
                    pushInfo.getAfterSha()
            );

            // 2. 변경된 파일 목록 수집
            List<GHCommit.File> changedFiles = githubApiClient.getChangedFiles(
                    installationId,
                    pushInfo.getRepoFullName(),
                    pushInfo.getBeforeSha(),
                    pushInfo.getAfterSha()
            );

            // 3. 파일별 상세 diff 정보 수집
            List<FileChangeInfo> fileChanges = collectFileChanges(
                    installationId, pushInfo.getRepoFullName(), changedFiles
            );

            // 4. PR 생성 데이터 구성
            PullRequestData prData = PullRequestData.builder()
                    .pushInfo(pushInfo)
                    .commits(commits)
                    .changedFiles(changedFiles)
                    .fileChanges(fileChanges)
                    .title(generatePRTitle(pushInfo, commits))
                    .body(generatePRBody(pushInfo, commits, fileChanges))
                    .build();

            // 5. PR 생성 준비 완료 로그
            log.info("PR preparation completed - Files changed: {}, Total lines: +{} -{}",
                    fileChanges.size(),
                    fileChanges.stream().mapToInt(FileChangeInfo::getAdditions).sum(),
                    fileChanges.stream().mapToInt(FileChangeInfo::getDeletions).sum()
            );

            // 6. 실제 PR 생성 또는 임시 저장 (사용자 검토용)
            savePendingPullRequest(prData);

        } catch (Exception e) {
            log.error("Error preparing PR creation", e);
        }
    }

    private List<FileChangeInfo> collectFileChanges(Long installationId, String repoFullName, List<GHCommit.File> changedFiles) {
        List<FileChangeInfo> fileChanges = new ArrayList<>();

        for (GHCommit.File file : changedFiles) {
            try {
                // GHCommit.File 객체에서 기본 정보 추출
                FileChangeInfo.FileChangeInfoBuilder builder = FileChangeInfo.builder()
                        .filename(file.getFileName())
                        .status(file.getStatus())
                        .additions(file.getLinesAdded())
                        .deletions(file.getLinesDeleted())
                        .changes(file.getLinesChanged());

                // 상세 diff 정보가 필요한 경우
                if (needsDetailedDiff(file)) {
                    String detailedPatch = file.getPatch(); // GHCommit.File에서 직접 patch 가져오기
                    if (detailedPatch != null && !detailedPatch.isEmpty()) {
                        List<DiffHunk> diffHunks = diffService.parseDiffHunks(detailedPatch);
                        builder.patch(detailedPatch).diffHunks(diffHunks);
                    }
                }

                fileChanges.add(builder.build());

            } catch (Exception e) {
                log.error("Error processing file change: {}", file.getFileName(), e);
            }
        }

        return fileChanges;
    }

    private boolean needsDetailedDiff(GHCommit.File file) {
        // 코드 파일이거나 중요한 파일만 상세 diff 수집
        String filename = file.getFileName();
        return filename.endsWith(".java") ||
                filename.endsWith(".js") ||
                filename.endsWith(".ts") ||
                filename.endsWith(".py") ||
                filename.endsWith(".go") ||
                filename.contains("config") ||
                filename.contains("Dockerfile");
    }

    private String generatePRTitle(PushEventInfo pushInfo, List<Commit> commits) {
        if (commits.size() == 1) {
            try {
                return commits.get(0).getCommitShortInfo().getMessage();
            } catch (IOException e) {
                log.error("Error getting commit message", e);
            }
        }

        // 브랜치명에서 제목 생성
        String title = pushInfo.getBranchName()
                .replace("feature/", "")
                .replace("bugfix/", "Fix: ")
                .replace("hotfix/", "Hotfix: ")
                .replace("-", " ")
                .replace("_", " ");

        // 첫 글자 대문자로 변환 (빈 문자열 체크)
        if (title.length() > 0) {
            return title.substring(0, 1).toUpperCase() + title.substring(1);
        }

        return pushInfo.getBranchName(); // fallback
    }

    private String generatePRBody(PushEventInfo pushInfo, List<Commit> commits, List<FileChangeInfo> fileChanges) {
        StringBuilder body = new StringBuilder();

        body.append("## 🚀 Auto-generated Pull Request\n\n");
        body.append(String.format("**Branch:** `%s` → `%s`\n", pushInfo.getBranchName(), pushInfo.getDefaultBranch()));
        body.append(String.format("**Author:** @%s\n", pushInfo.getPusherName()));
        body.append(String.format("**Commits:** %d\n\n", commits.size()));

        // 커밋 목록
        body.append("## 📝 Commits\n");
        for (GHCommit commit : commits) {
            try {
                String sha = commit.getSHA1().substring(0, 7);
                String message = commit.getCommitShortInfo().getMessage();
                body.append(String.format("- `%s` %s\n", sha, message));
            } catch (IOException e) {
                log.error("Error getting commit info", e);
            }
        }

        // 변경된 파일 통계
        body.append("\n## 📊 File Changes\n");
        int totalAdditions = fileChanges.stream().mapToInt(FileChangeInfo::getAdditions).sum();
        int totalDeletions = fileChanges.stream().mapToInt(FileChangeInfo::getDeletions).sum();

        body.append(String.format("**%d files changed** (+%d additions, -%d deletions)\n\n",
                fileChanges.size(), totalAdditions, totalDeletions));

        for (FileChangeInfo file : fileChanges) {
            String statusEmoji = getStatusEmoji(file.getStatus());
            body.append(String.format("%s `%s` (+%d -%d)\n",
                    statusEmoji, file.getFilename(), file.getAdditions(), file.getDeletions()));
        }

        body.append("\n## ✅ Review Checklist\n");
        body.append("- [ ] Code review completed\n");
        body.append("- [ ] Tests added/updated\n");
        body.append("- [ ] Documentation updated\n");
        body.append("- [ ] Line-by-line comments added where needed\n\n");

        body.append("---\n");
        body.append("*This PR was automatically created. Please review and add line comments before merging.*");

        return body.toString();
    }

    private String getStatusEmoji(String status) {
        return switch (status.toLowerCase()) {
            case "added" -> "🆕";
            case "modified" -> "📝";
            case "removed" -> "🗑️";
            case "renamed" -> "📋";
            default -> "📄";
        };
    }

    private void savePendingPullRequest(PullRequestData prData) {
        // 실제로는 DB에 저장하여 사용자가 검토 후 생성할 수 있도록 함
        log.info("Saved pending PR for review: {} -> {}",
                prData.getPushInfo().getBranchName(),
                prData.getPushInfo().getDefaultBranch());

        // 임시로 로그에 출력
        log.info("PR Title: {}", prData.getTitle());
        log.info("Files to review: {}",
                prData.getFileChanges().stream()
                        .map(FileChangeInfo::getFilename)
                        .collect(Collectors.joining(", ")));
    }

    private Long getInstallationId(Long repoId) {
        Repo repo = repository.findByRepoId(repoId)
                .orElseThrow(() -> new IllegalArgumentException("Repository not found for ID: " + repoId));
        return repo.getAccount().getInstallationId();
    }
}