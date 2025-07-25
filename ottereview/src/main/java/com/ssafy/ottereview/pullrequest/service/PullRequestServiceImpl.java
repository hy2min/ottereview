package com.ssafy.ottereview.pullrequest.service;

import com.ssafy.ottereview.github.client.GithubApiClient;
import com.ssafy.ottereview.github.dto.GithubPrResponse;
import com.ssafy.ottereview.pullrequest.dto.PullRequestCreateRequest;
import com.ssafy.ottereview.pullrequest.dto.PullRequestResponse;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.util.List;
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
    private final UserRepository userRepository;
    private final RepoRepository repoRepository;
    
    @Override
    public List<PullRequestResponse> getPullRequestsByRepositoryId(Long repositoryId) {
        
        // 예시로 사용되는 값들
        Long installationId = 77362016L;
        String repositoryName = "kangboom/Algorithm";
        
        // 1. github api를 호출하여 Pull Request 목록을 가져온다.
        List<GithubPrResponse> githubPrResponses = githubApiClient.getPullRequests(installationId, repositoryName);
        
        // 2. 가져온 Pull Request 목록을 PullRequest 엔티티로 변환한다.
        List<PullRequest> pullRequests = githubPrResponses.stream()
                .map(this::gitHubResponseToEntity)
                .toList();
        
        // 3. 변환된 Pull Request 엔티티를 데이터베이스에 저장한다.
        pullRequestRepository.saveAll(pullRequests);
        
        // 4. 저장된 Pull Request 엔티티를 PullRequestResponse DTO로 변환하여 반환한다.
        return pullRequests.stream()
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
    
    public PullRequest gitHubResponseToEntity(GithubPrResponse githubPrResponse) {
        
        User author = userRepository.save(new User("test", "test@email.com", "www.test.com", 1L, 100, "role"));
        Repo repo = repoRepository.save(new Repo("kangboom/Algorithm", "Kang Boom", 1L, false, false));
        
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
                .repoId(pr.getRepo())
                .authorId(pr.getAuthor())
                .build();
    }
}
