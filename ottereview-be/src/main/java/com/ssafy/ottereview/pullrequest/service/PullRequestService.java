package com.ssafy.ottereview.pullrequest.service;

import com.ssafy.ottereview.pullrequest.dto.request.PullRequestCreateRequest;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestDetailResponse;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import java.util.List;
import org.kohsuke.github.GHRepository;

public interface PullRequestService {
    
    /**
     * Github repoId로 Github에서 Pull Request 리스트를 조회합니다.
     */
    List<PullRequestResponse> getPullRequestsByGithub(CustomUserDetail customUserDetail, Long repositoryId);
    
    /**
     * pr-id로 DB에 저장된 Pull Request를 조회합니다.
     */
    PullRequestDetailResponse getPullRequestById(CustomUserDetail customUserDetail, Long repoId, Long pullRequestId);
    
    /**
     *  새로운 Pull Request를 생성합니다.
     *
     * @param pullRequestCreateRequest Pull Request 생성 요청 정보
     */
    void createPullRequest(CustomUserDetail customUserDetail, Long repoId, PullRequestCreateRequest pullRequestCreateRequest);
    
    /**
     * Github에 있는 PullRequest를 DB에 저장합니다.
     */
    void createPullRequestFromGithub(List<GHRepository> GHRepositories);
    
}
