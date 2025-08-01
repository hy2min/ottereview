package com.ssafy.ottereview.reviewer.service;

import com.ssafy.ottereview.reviewer.dto.ReviewerResponse;
import com.ssafy.ottereview.reviewer.entity.Reviewer;
import java.util.List;

public interface ReviewerService {

    public List<ReviewerResponse> getReviewerByPullRequest(Long pullRequestId);

    public void createReviewer(Reviewer reviewer);

    public void createReviewerList(List<Reviewer> reviewers);
}
