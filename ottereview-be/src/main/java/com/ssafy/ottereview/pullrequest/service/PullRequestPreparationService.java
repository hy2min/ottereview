package com.ssafy.ottereview.pullrequest.service;

import com.ssafy.ottereview.account.repository.UserAccountRepository;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.pullrequest.dto.CommitInfo;
import com.ssafy.ottereview.pullrequest.dto.DiffHunk;
import com.ssafy.ottereview.pullrequest.dto.FileChangeInfo;
import com.ssafy.ottereview.pullrequest.dto.PreparePullRequestResponse;
import com.ssafy.ottereview.pullrequest.dto.request.PullRequestValidationRequest;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHCommit;
import org.kohsuke.github.GHCompare;
import org.kohsuke.github.GHCompare.Commit;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class PullRequestPreparationService {
    
    private final UserRepository userRepository;
    private final GithubApiClient githubApiClient;
    private final GitHubDiffService diffService;
    private final RepoRepository repoRepository;
    private final UserAccountRepository userAccountRepository;
    
    public PreparePullRequestResponse validatePullRequest(CustomUserDetail customUserDetail, Long repoId, PullRequestValidationRequest request) {
        
        User loginUser = userRepository.findById(customUserDetail.getUser()
                        .getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + customUserDetail.getUser()
                        .getId()));
        
        Repo repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Repository not found with id: " + repoId));
        
        if (!userAccountRepository.existsByUserAndAccount(loginUser, repo.getAccount())) {
            throw new IllegalArgumentException("유저는 해당 레포지토리의 계정에 속하지 않습니다.");
        }
        
        GHCompare compare = githubApiClient.getCompare(repo.getAccount()
                .getInstallationId(), repo.getFullName(), request.getTarget(), request.getSource());
        
        return convetToPreparePullRequestResponse(compare, request);
    }
    
    private PreparePullRequestResponse convetToPreparePullRequestResponse(GHCompare compare, PullRequestValidationRequest request) {
        return PreparePullRequestResponse.builder()
                .source(request.getSource())
                .target(request.getTarget())
                .url(compare.getUrl()
                        .toString())
                .htmlUrl(compare.getHtmlUrl()
                        .toString())
                .permalinkUrl(compare.getPermalinkUrl()
                        .toString())
                .diffUrl(compare.getDiffUrl()
                        .toString())
                .patchUrl(compare.getPatchUrl()
                        .toString())
                .aheadBy(compare.getAheadBy())
                .behindBy(compare.getBehindBy())
                .totalCommits(compare.getTotalCommits())
                .status(compare.getStatus())
                .baseCommit(convertToCommitInfo(compare.getBaseCommit()))
                .mergeBaseCommit(convertToCommitInfo(compare.getMergeBaseCommit()))
                .commits(convertCommitArray(compare.getCommits()))
                .files(convertToFileChanges(compare.getFiles()))
                .build();
    }
    
    private List<FileChangeInfo> convertToFileChanges(GHCommit.File[] changedFiles) {
        List<FileChangeInfo> fileChanges = new ArrayList<>();
        
        for (GHCommit.File file : changedFiles) {
            try {
                // GHCommit.File 객체에서 기본 정보 추출
                FileChangeInfo.FileChangeInfoBuilder builder = FileChangeInfo.builder()
                        .filename(file.getFileName())
                        .status(file.getStatus())
                        .additions(file.getLinesAdded())
                        .deletions(file.getLinesDeleted())
                        .rawUrl(file.getRawUrl())
                        .blobUrl(file.getBlobUrl())
                        .changes(file.getLinesChanged());
                
                String detailedPatch = file.getPatch();
                if (detailedPatch != null && !detailedPatch.isEmpty()) {
                    List<DiffHunk> diffHunks = diffService.parseDiffHunks(detailedPatch);
                    builder.patch(detailedPatch)
                            .diffHunks(diffHunks);
                    
                }
                
                fileChanges.add(builder.build());
                
            } catch (Exception e) {
                log.error("Error processing file change: {}", file.getFileName(), e);
            }
        }
        
        return fileChanges;
    }
    
    private CommitInfo convertToCommitInfo(Commit commit) {
        if (commit == null) {
            return null;
        }
        
        try {
            return CommitInfo.builder()
                    .sha(commit.getSHA1())
                    .message(commit.getCommit()
                            .getMessage())
                    .authorName(commit.getCommit()
                            .getAuthor()
                            .getName())
                    .authorEmail(commit.getCommit()
                            .getAuthor()
                            .getEmail())
                    .authorDate(commit.getCommit()
                            .getAuthor()
                            .getDate()
                            .toString())
                    .committerName(commit.getCommit()
                            .getCommitter()
                            .getName())
                    .committerEmail(commit.getCommit()
                            .getCommitter()
                            .getEmail())
                    .committerDate(commit.getCommit()
                            .getCommitter()
                            .getDate()
                            .toString())
                    .url(commit.getUrl()
                            .toString())
                    .htmlUrl(commit.getHtmlUrl()
                            .toString())
                    .additions(commit.getLinesAdded())
                    .deletions(commit.getLinesDeleted())
                    .totalChanges(commit.getLinesChanged())
                    .build();
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to convert commit info: " + e.getMessage(), e);
        }
    }
    
    private List<CommitInfo> convertCommitArray(Commit[] commits) {
        if (commits == null) {
            return Collections.emptyList();
        }
        
        return Arrays.stream(commits)
                .map(this::convertToCommitInfo)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
}
