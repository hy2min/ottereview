package com.ssafy.ottereview.reviewer.service;

import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.exception.PullRequestErrorCode;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.reviewer.dto.ReviewerResponse;
import com.ssafy.ottereview.reviewer.entity.Reviewer;
import com.ssafy.ottereview.reviewer.repository.ReviewerRepository;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.exception.UserErrorCode;
import com.ssafy.ottereview.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReviewerServiceImpl implements ReviewerService {

    private final ReviewerRepository reviewerRepository;
    private final PullRequestRepository pullRequestRepository;
    private final UserRepository userRepository;
    
    @Override
    public List<ReviewerResponse> getReviewerByPullRequest(Long pullRequestId) {
        PullRequest pullRequest = pullRequestRepository.findById(pullRequestId).orElseThrow(() -> new BusinessException(PullRequestErrorCode.PR_NOT_FOUND));
        List<Reviewer> reviewerList = reviewerRepository.findAllByPullRequest(pullRequest);
        return reviewerList.stream().map(ReviewerResponse::fromEntity).toList();
    }

    @Override
    public List<PullRequestResponse> getMyReviewPullRequests(CustomUserDetail customUserDetail) {
        User loginUser = userRepository.findById(customUserDetail.getUser()
                        .getId())
                .orElseThrow(() -> new BusinessException(UserErrorCode.USER_NOT_FOUND));

        List<Reviewer> reviewers = reviewerRepository.findAllByUser(loginUser);

        return reviewers.stream()
                .map(Reviewer::getPullRequest)
                .map(PullRequestResponse::fromEntity)
                .toList();
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
