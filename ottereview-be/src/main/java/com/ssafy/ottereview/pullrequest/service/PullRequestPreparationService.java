package com.ssafy.ottereview.pullrequest.service;

import com.ssafy.ottereview.account.service.UserAccountService;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.pullrequest.dto.preparation.CommitInfo;
import com.ssafy.ottereview.pullrequest.dto.preparation.DiffHunk;
import com.ssafy.ottereview.pullrequest.dto.preparation.FileChangeInfo;
import com.ssafy.ottereview.pullrequest.dto.preparation.PreparationResult;
import com.ssafy.ottereview.pullrequest.dto.preparation.RepoInfo;
import com.ssafy.ottereview.pullrequest.dto.preparation.UserInfo;
import com.ssafy.ottereview.pullrequest.dto.preparation.request.AdditionalInfoRequest;
import com.ssafy.ottereview.pullrequest.dto.preparation.request.PreparationValidationRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRedisRepository;
import com.ssafy.ottereview.pullrequest.util.DiffUtil;
import com.ssafy.ottereview.repo.entity.Repo;
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
import org.springframework.transaction.annotation.Transactional;

@Transactional
@Service
@Slf4j
@RequiredArgsConstructor
public class PullRequestPreparationService {
    
    private final UserRepository userRepository;
    private final GithubApiClient githubApiClient;
    private final DiffUtil diffUtil;
    private final UserAccountService userAccountService;
    private final PullRequestRedisRepository pullRequestRedisService;
    
    public PreparationResult getPreparePullRequestInfo(CustomUserDetail userDetail, Long repoId, String source, String target) {
        
        userAccountService.validateUserPermission(userDetail.getUser()
                .getId(), repoId);
        
        PreparationResult preparationResult = pullRequestRedisService.getPrepareInfo(repoId, source, target);
        
        if (preparationResult == null) {
            throw new IllegalArgumentException("준비된 Pull Request 정보가 없습니다.");
        }
        
        return preparationResult;
    }
    
    public PreparationResult validatePullRequest(CustomUserDetail userDetail, Long repoId, PreparationValidationRequest request) {
        
        // 1. 유저 권한 검증
        Repo repo = userAccountService.validateUserPermission(userDetail.getUser()
                .getId(), repoId);

       User author = userDetail.getUser();
        
        GHCompare compare = githubApiClient.getCompare(repo.getAccount()
                .getInstallationId(), repo.getFullName(), request.getTarget(), request.getSource());
        
        PreparationResult preparationResult = convertToPreparePullRequestResponse(author, repo, compare, request);
        
        pullRequestRedisService.savePrepareInfo(repoId, preparationResult);
        
        return preparationResult;
    }
    
    public void enrollAdditionalInfo(CustomUserDetail userDetail, Long repoId, AdditionalInfoRequest request) {
        try {
            userAccountService.validateUserPermission(userDetail.getUser()
                    .getId(), repoId);
            
            // 1. 기존 데이터 조회
            PreparationResult prepareInfo = pullRequestRedisService.getPrepareInfo(repoId, request.getSource(), request.getTarget());
            
            // 2. 선택적 필드들 업데이트
            if (request.getTitle() != null) {
                prepareInfo.enrollTitle(request.getTitle());
            }
            
            if (request.getBody() != null) {
                prepareInfo.enrollBody(request.getBody());
            }
            if (request.getReviewers() != null && !request.getReviewers()
                    .isEmpty()) {
                List<UserInfo> userInfos = convertToReviewerInfos(request.getReviewers());
                prepareInfo.enrollReviewers(userInfos);
            }
            
            if (request.getSummary() != null && !request.getSummary()
                    .trim()
                    .isEmpty()) {
                prepareInfo.enrollSummary(request.getSummary());
            }
            
            if (request.getDescription() != null && !request.getDescription()
                    .isEmpty()) {
                prepareInfo.enrollDescriptions(request.getDescription());
            }

            if (request.getDescription() != null && !request.getDescription()
                    .isEmpty()) {
                prepareInfo.enrollDescriptions(request.getDescription());
            }

            if (request.getPriorities() != null && !request.getPriorities()
                    .isEmpty()) {
                prepareInfo.enrollPriorities(request.getPriorities());
            }
            
            // 4. Repository에서 저장
            pullRequestRedisService.updatePrepareInfo(repoId, prepareInfo);
            
        } catch (Exception e) {
            log.error("추가 정보 업데이트 실패", e);
            throw new RuntimeException("추가 정보 업데이트 실패", e);
        }
    }
    
    private List<UserInfo> convertToReviewerInfos(List<Long> reviewerIds) {
        // reviewerIds를 ReviewerInfo 객체로 변환하는 로직
        return reviewerIds.stream()
                .map(this::getReviewerInfoById)
                .collect(Collectors.toList());
    }
    
    private UserInfo getReviewerInfoById(Long reviewerId) {
        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new IllegalArgumentException("Reviewer not found with id: " + reviewerId));
        
        return UserInfo.builder()
                .id(reviewer.getId())
                .githubUsername(reviewer.getGithubUsername())
                .githubEmail(reviewer.getGithubEmail())
                .build();
    }
    
    private PreparationResult convertToPreparePullRequestResponse(User author, Repo repo, GHCompare compare, PreparationValidationRequest request) {
        return PreparationResult.builder()
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
                .author(UserInfo.of(author.getId(), author.getGithubUsername(), author.getGithubEmail()))
                .repository(RepoInfo.of(repo.getId(), repo.getFullName()))
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
                    List<DiffHunk> diffHunks = diffUtil.parseDiffHunks(detailedPatch);
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
    
    private boolean canCreatePR(PreparationResult preparationResult) {
        // 1. 브랜치 상태 확인
        if (!"ahead".equals(preparationResult.getStatus())) {
            return false; // "identical", "behind", "diverged" 상태에서는 PR 불가
        }
        
        // 2. 커밋 차이 확인
        if (preparationResult.getAheadBy() <= 0) {
            return false; // target보다 앞선 커밋이 없으면 PR 불가
        }
        
        // 3. 변경된 파일 확인
        if (preparationResult.getFiles() == null || preparationResult.getFiles().isEmpty()) {
            return false; // 변경된 파일이 없으면 PR 불가
        }
        
        return true;
    }
}
