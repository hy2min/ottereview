package com.ssafy.ottereview.pullrequest.service;

import com.ssafy.ottereview.pullrequest.dto.PullRequestCreateRequest;
import com.ssafy.ottereview.pullrequest.dto.PullRequestResponse;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import java.util.List;

public interface PullRequestService {

    /**
     * 레포지토리 ID에 해당하는 모든 Pull Request를 조회합니다.
     * @param repositoryId 레포지토리 ID
     * @return 레포지토리 ID에 해당하는 모든 Pull Request의 리스트
     */
    List<PullRequestResponse> getPullRequestsByRepositoryId(CustomUserDetail customUserDetail, Long repositoryId);

    /**
     * 레포지토리 ID에 해당하는 Pull Request의 상세 정보를 조회합니다.
     * @param pullRequestId Pull Request ID
     * @return 해당 Pull Request의 상세 정보
     */
    PullRequestResponse getPullRequestById(Long pullRequestId);

    /**
     * 레포지토리에 새로운 Pull Request를 생성합니다.
     * @param pullRequestCreateRequest
     */
    void createPullRequest(PullRequestCreateRequest pullRequestCreateRequest);
}
