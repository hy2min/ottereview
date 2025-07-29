package com.ssafy.ottereview.pullrequest.service;

import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.githubapp.dto.GithubPrResponse;
import com.ssafy.ottereview.pullrequest.dto.PullRequestCreateRequest;
import com.ssafy.ottereview.pullrequest.dto.PullRequestResponse;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.user.dto.UserResponseDto;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.entity.User;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@RequiredArgsConstructor
@Service
@Transactional
public class PullRequestServiceImpl implements PullRequestService {

    private final GithubApiClient githubApiClient;
    private final PullRequestRepository pullRequestRepository;
    private final RepoRepository repoRepository;

    @Override
    public List<PullRequestResponse> getPullRequestsByRepositoryId(CustomUserDetail userDetail, Long repositoryId) {

        // 1. repositoryId로 Repo 엔티티를 조회한다.
        Repo targetRepo = repoRepository.findById(repositoryId)
                .orElseThrow(() -> new IllegalArgumentException("Repository not found with id: " + repositoryId));

        // 2. Repo 엔티티에서 GitHub 저장소 이름과 설치 ID를 가져온다.
        String repositoryFullName = targetRepo.getFullName();
        Long installationId = targetRepo.getAccount()
                .getInstallationId();

        // 3. GitHub API를 호출하여 해당 레포지토리의 Pull Request 목록을 가져온다.
        List<GithubPrResponse> githubPrResponses = githubApiClient.getPullRequests(installationId, repositoryFullName);
        log.info("=== 3단계: GitHub API 응답 ===");
        log.info("GitHub에서 가져온 PR 개수: {}", githubPrResponses.size());
        for (int i = 0; i < githubPrResponses.size(); i++) {
            GithubPrResponse pr = githubPrResponses.get(i);
            log.info("GitHub PR [{}]:", i + 1);
            log.info("  - GitHub PR ID: {}", pr.getGithubPrId());
            log.info("  - Title: {}", pr.getTitle());
            log.info("  - State: {}", pr.getStatus());
            log.info("  - Created At: {}", pr.getCreatedAt());
            log.info("  - Updated At: {}", pr.getUpdatedAt());
            log.info("  - Head Branch: {}", pr.getHeadBranch() != null ? pr.getHeadBranch() : "null");
            log.info("  - Base Branch: {}", pr.getBaseBranch() != null ? pr.getBaseBranch() : "null");
            log.info("  - Commits: {}", pr.getCommitCnt());
            log.info("  - Additions: {}", pr.getAdditionCnt());
            log.info("  - Deletions: {}", pr.getDeletionCnt());
            log.info("  - Changed Files: {}", pr.getChangedFilesCnt());
        }

        // 4. 이미 데이터베이스에 저장된 Pull Request 목록을 조회한다.
        List<PullRequest> existingPullRequests = pullRequestRepository.findAllByRepo(targetRepo);
        log.info("=== 4단계: 기존 DB Pull Request 조회 ===");
        log.info("DB에 저장된 PR 개수: {}", existingPullRequests.size());
        for (int i = 0; i < existingPullRequests.size(); i++) {
            PullRequest pr = existingPullRequests.get(i);
            log.info("기존 DB PR [{}]:", i + 1);
            log.info("  - DB ID: {}", pr.getId());
            log.info("  - GitHub PR ID: {}", pr.getGithubPrId());
            log.info("  - Title: {}", pr.getTitle());
            log.info("  - Status: {}", pr.getStatus());
            log.info("  - Author Login: {}", pr.getAuthorLogin());
            log.info("  - Head Branch: {}", pr.getHeadBranch());
            log.info("  - Base Branch: {}", pr.getBaseBranch());
            log.info("  - GitHub Created At: {}", pr.getGithubCreatedAt());
            log.info("  - GitHub Updated At: {}", pr.getGithubUpdatedAt());
            log.info("  - Commit Count: {}", pr.getCommitCnt());
            log.info("  - Addition Count: {}", pr.getAdditionCnt());
            log.info("  - Deletion Count: {}", pr.getDeletionCnt());
        }
        Map<Long, PullRequest> existingPrMap = existingPullRequests.stream()
                .collect(Collectors.toMap(PullRequest::getGithubPrId, pr -> pr));

        // 5. GitHub에서 가져온 PR 번호 Set
        Set<Long> githubPrNumbers = githubPrResponses.stream()
                .map(GithubPrResponse::getGithubPrId)
                .collect(Collectors.toSet());

        log.info("=== 5단계: GitHub PR ID 매핑 ===");
        log.info("GitHub PR IDs: {}", githubPrNumbers);
        log.info("기존 DB PR IDs: {}", existingPrMap.keySet());

        // 6. 새로운 PR과 기존 PR을 비교하여 저장할 Pull Request 목록을 준비한다.
        log.info("=== 6단계: PR 동기화 처리 ===");
        List<PullRequest> pullRequestsToSave = new ArrayList<>();

        for (GithubPrResponse githubPr : githubPrResponses) {
            PullRequest existingPr = existingPrMap.get(githubPr.getGithubPrId());

            if (existingPr == null) {
                // 6-1. 새로운 PR: 생성
                PullRequest newPr = convertToEntity(githubPr, userDetail.getUser(), targetRepo);
                newPr.enrollRepo(targetRepo);
                pullRequestsToSave.add(newPr);

                log.info("새로운 PR 생성 완료:");
                log.info("  - GitHub PR ID: {}", newPr.getGithubPrId());
                log.info("  - Title: {}", newPr.getTitle());
                log.info("  - Status: {}", newPr.getStatus());
                log.info("  - Author Login: {}", newPr.getAuthorLogin());
                log.info("  - Head Branch: {}", newPr.getHeadBranch());
                log.info("  - Base Branch: {}", newPr.getBaseBranch());
                log.info("  - Mergeable: {}", newPr.isMergeable());
                log.info("  - Approve Count: {}", newPr.getApproveCount());
                log.info("  - GitHub Created At: {}", newPr.getGithubCreatedAt());
                log.info("  - Repo: {}", newPr.getRepo() != null ? newPr.getRepo()
                        .getFullName() : "null");
                log.info("  - Author: {}", newPr.getAuthor() != null ? newPr.getAuthor() : "null");


            } else {
                // 6-2. 기존 PR: 업데이트 (변경사항이 있는 경우만)
                if (existingPr.hasChangedFrom(githubPr)) {
                    log.info("기존 PR 업데이트 전:");
                    log.info("  - Title: {} -> {}", existingPr.getTitle(), githubPr.getTitle());
                    log.info("  - Status: {} -> {}", existingPr.getStatus(), githubPr.getStatus());
                    log.info("  - Updated At: {} -> {}", existingPr.getGithubUpdatedAt(), githubPr.getUpdatedAt());
                    log.info("  - Commit Count: {} -> {}", existingPr.getCommitCnt(), githubPr.getCommitCnt());

                    existingPr.updateFromGithub(githubPr);
                    pullRequestsToSave.add(existingPr);
                    log.info("PR 업데이트: #{} - {}", githubPr.getGithubPrId(), githubPr.getTitle());
                    log.info("기존 PR 업데이트 후:");
                    log.info("  - Title: {}", existingPr.getTitle());
                    log.info("  - Status: {}", existingPr.getStatus());
                    log.info("  - Updated At: {}", existingPr.getGithubUpdatedAt());
                    log.info("  - Commit Count: {}", existingPr.getCommitCnt());

                }
            }
        }

        // 7. 데이터베이스에 없는 PR들을 삭제 처리한다.
        List<PullRequest> prsToMarkAsDeleted = existingPullRequests.stream()
                .filter(pr -> !githubPrNumbers.contains(pr.getGithubPrId()))
                .toList();

        log.info("=== 7단계: 삭제할 PR 처리 ===");
        log.info("삭제할 PR 개수: {}", prsToMarkAsDeleted.size());
        for (PullRequest prToDelete : prsToMarkAsDeleted) {
            log.info("삭제할 PR:");
            log.info("  - DB ID: {}", prToDelete.getId());
            log.info("  - GitHub PR ID: {}", prToDelete.getGithubPrId());
            log.info("  - Title: {}", prToDelete.getTitle());
            log.info("  - 현재 Status: {}", prToDelete.getStatus());
        }

        pullRequestRepository.deleteAll(prsToMarkAsDeleted);

        // 8. 새로운 PR들을 데이터베이스에 저장한다.
        log.info("=== 8단계: 새로운 PR 저장 ===");
        log.info("저장할 새로운 PR 개수: {}", pullRequestsToSave.size());
        for (int i = 0; i < pullRequestsToSave.size(); i++) {
            PullRequest pr = pullRequestsToSave.get(i);
            log.info("기존 DB PR [{}]:", i + 1);
            log.info("  - DB ID: {}", pr.getId());
            log.info("  - GitHub PR ID: {}", pr.getGithubPrId());
            log.info("  - Title: {}", pr.getTitle());
            log.info("  - Status: {}", pr.getStatus());
            log.info("  - Author Login: {}", pr.getAuthorLogin());
            log.info("  - Head Branch: {}", pr.getHeadBranch());
            log.info("  - Base Branch: {}", pr.getBaseBranch());
            log.info("  - GitHub Created At: {}", pr.getGithubCreatedAt());
            log.info("  - GitHub Updated At: {}", pr.getGithubUpdatedAt());
            log.info("  - Commit Count: {}", pr.getCommitCnt());
            log.info("  - Addition Count: {}", pr.getAdditionCnt());
            log.info("  - Deletion Count: {}", pr.getDeletionCnt());
        }

        if (!pullRequestsToSave.isEmpty()) {
            pullRequestRepository.saveAll(pullRequestsToSave);
            log.info("총 {}개의 PR이 동기화되었습니다.", pullRequestsToSave.size());
        }

        // 9. 최종 결과 조회 및 반환 (삭제된 PR 제외)
        log.debug("=== 9단계: 최종 PR 조회 ===");
        List<PullRequest> finalPullRequests = pullRequestRepository.findAllByRepo(targetRepo);

        return finalPullRequests.stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Override
    public PullRequestResponse getPullRequestById(Long pullRequestId) {
        return null;
    }

    @Override
    public void createPullRequest(PullRequestCreateRequest pullRequestCreateRequest) {

    }

    private PullRequest convertToEntity(GithubPrResponse githubPrResponse, User author, Repo repo) {

        return PullRequest.builder()
                .githubPrId(githubPrResponse.getGithubPrId())
                .author(author)
                .repo(repo)
                .title(githubPrResponse.getTitle())
                .description(githubPrResponse.getDescription())
                .summary("") // 초기값 - 나중에 AI로 생성
                .headBranch(githubPrResponse.getHeadBranch())
                .baseBranch(githubPrResponse.getBaseBranch())
                .status(githubPrResponse.getStatus())
                .approveCount(0) // 초기값 - 나중에 리뷰 분석으로 계산
                .mergeable(githubPrResponse.getMergeable())
                .authorLogin(githubPrResponse.getAuthorLogin())
                .htmlUrl(githubPrResponse.getHtmlUrl())
                .commitCnt(githubPrResponse.getCommitCnt())
                .additionCnt(githubPrResponse.getAdditionCnt())
                .deletionCnt(githubPrResponse.getDeletionCnt())
                .changedFilesCnt(githubPrResponse.getChangedFilesCnt())
                .commentCnt(githubPrResponse.getCommentCnt())
                .reviewCommentCnt(githubPrResponse.getReviewCommentCnt())
                .githubCreatedAt(githubPrResponse.getCreatedAt())
                .githubUpdatedAt(githubPrResponse.getUpdatedAt())
                .build();
    }

    private PullRequestResponse convertToResponse(PullRequest pr) {
        return PullRequestResponse.builder()
                .id(pr.getId())
                .githubPrId(pr.getGithubPrId())
                .title(pr.getTitle())
                .description(pr.getDescription())
                .summary(pr.getSummary())
                .headBranch(pr.getHeadBranch())
                .baseBranch(pr.getBaseBranch())
                .status(pr.getStatus())
                .approveCount(pr.getApproveCount())
                .mergeable(pr.isMergeable())
                .authorLogin(pr.getAuthorLogin())
                .htmlUrl(pr.getHtmlUrl())
                .commitCnt(pr.getCommitCnt())
                .additionCnt(pr.getAdditionCnt())
                .deletionCnt(pr.getDeletionCnt())
                .changedFilesCnt(pr.getChangedFilesCnt())
                .commentCnt(pr.getCommentCnt())
                .reviewCommentCnt(pr.getReviewCommentCnt())
                .githubCreatedAt(pr.getGithubCreatedAt())
                .githubUpdatedAt(pr.getGithubUpdatedAt())
                .patchUrl(pr.getPatchUrl())
                .diffUrl(pr.getDiffUrl())
                .mergedAt(pr.getMergedAt())
                .mergeCommitSha(pr.getMergeCommitSha())
                .repo(RepoResponse.of(pr.getRepo()))
                .author(toDto(pr.getAuthor()))
                .build();
    }

    private UserResponseDto toDto(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getGithubUsername(),
                user.getGithubEmail(),
                user.getProfileImageUrl(),
                user.getRewardPoints(),
                user.getUserGrade()
        );
    }
}
