package com.ssafy.ottereview.reviewer.service;

import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.reviewer.dto.ReviewerResponse;
import com.ssafy.ottereview.reviewer.entity.Reviewer;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import java.util.List;

public interface ReviewerService {

    List<ReviewerResponse> getReviewerByPullRequest(Long pullRequestId);

    void createReviewer(Reviewer reviewer);

    void createReviewerList(List<Reviewer> reviewers);

    List<PullRequestResponse> getMyReviewPullRequests( CustomUserDetail customUserDetail);
}
