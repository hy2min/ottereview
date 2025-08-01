package com.ssafy.ottereview.reviewer.service;

import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.reviewer.dto.ReviewerResponse;
import com.ssafy.ottereview.reviewer.entity.Reviewer;
import com.ssafy.ottereview.reviewer.repository.ReviewerRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReviewerServiceImpl implements ReviewerService {

    private final ReviewerRepository reviewerRepository;
    private final PullRequestRepository pullRequestRepository;

    @Override
    public List<ReviewerResponse> getReviewerByPullRequest(Long pullRequestId) {
        PullRequest pullRequest = pullRequestRepository.getReferenceById(pullRequestId);
        List<Reviewer> reviewerList = reviewerRepository.findAllByPullRequest(pullRequest);
        return reviewerList.stream().map(ReviewerResponse::of).toList();
    }

    @Override
    public void createReviewer(Reviewer reviewer) {
        reviewerRepository.save(reviewer);
    }

    @Override
    public void createReviewerList(List<Reviewer> reviewers) {
        reviewerRepository.saveAll(reviewers);
    }
}
