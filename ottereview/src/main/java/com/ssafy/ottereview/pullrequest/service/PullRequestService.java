package com.ssafy.ottereview.pullrequest.service;

import com.ssafy.ottereview.githubapp.dto.GithubPrResponse;
import com.ssafy.ottereview.pullrequest.dto.request.PullRequestCreateRequest;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestDetailResponse;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.entity.User;
import java.util.List;
import org.kohsuke.github.GHRepository;

public interface PullRequestService {

    /**
     * 레포지토리 ID에 해당하는 모든 Pull Request를 조회합니다.
     *
     * @param repositoryId 레포지토리 ID
     * @return 레포지토리 ID에 해당하는 모든 Pull Request의 리스트
     */
    List<PullRequestResponse> getPullRequestsByRepositoryId(CustomUserDetail customUserDetail, Long repositoryId);

    /**
     * 레포지토리 ID에 해당하는 Pull Request의 상세 정보를 조회합니다.
     *
     * @param pullRequestId Pull Request ID
     * @return 해당 Pull Request의 상세 정보
     */
    PullRequestDetailResponse getPullRequestById(CustomUserDetail customUserDetail, Long pullRequestId);

    /**
     * 레포지토리에 새로운 Pull Request를 생성합니다.
     *
     * @param pullRequestCreateRequest
     */
    void createPullRequest(CustomUserDetail customUserDetail, PullRequestCreateRequest pullRequestCreateRequest);

    void synchronizePullRequestsWithGithub(List<GithubPrResponse> githubPrResponses, Repo targetRepo, User user);

    void createPullRequestFromGithubRepository(List<GHRepository> GHRepositories);
}
