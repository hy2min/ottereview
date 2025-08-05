package com.ssafy.ottereview.reviewer.service;

import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import com.ssafy.ottereview.reviewer.dto.ReviewerResponse;
import com.ssafy.ottereview.reviewer.entity.Reviewer;
import com.ssafy.ottereview.reviewer.repository.ReviewerRepository;
import com.ssafy.ottereview.user.dto.UserResponseDto;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.entity.User;
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
        PullRequest pullRequest = pullRequestRepository.getReferenceById(pullRequestId);
        List<Reviewer> reviewerList = reviewerRepository.findAllByPullRequest(pullRequest);
        return reviewerList.stream().map(ReviewerResponse::of).toList();
    }

    @Override
    public List<PullRequestResponse> getMyReviewPullRequests(CustomUserDetail customUserDetail) {
        User loginUser = userRepository.findById(customUserDetail.getUser()
                        .getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Reviewer> reviewers = reviewerRepository.findAllByUser(loginUser);
        log.debug("Reviewer count: {}", reviewers.size());

        return reviewers.stream()
                .map(Reviewer::getPullRequest)
                .map(this::convertToResponse)
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

    private PullRequestResponse convertToResponse(PullRequest pr) {
        return PullRequestResponse.builder()
                .id(pr.getId())
                .githubPrNumber(pr.getGithubPrNumber())
                .title(pr.getTitle())
                .body(pr.getBody())
                .summary(pr.getSummary())
                .approveCnt(pr.getApproveCnt())
                .state(pr.getState())
                .merged(pr.getMerged())
                .mergeable(pr.isMergeable())
                .head(pr.getHead())
                .base(pr.getBase())
                .commitCnt(pr.getCommitCnt())
                .changedFilesCnt(pr.getChangedFilesCnt())
                .commentCnt(pr.getCommentCnt())
                .reviewCommentCnt(pr.getReviewCommentCnt())
                .githubCreatedAt(pr.getGithubCreatedAt())
                .githubUpdatedAt(pr.getGithubUpdatedAt())
                .repo(RepoResponse.of(pr.getRepo()))
                .author(convertToUserResponse(pr.getAuthor()))
                .build();
    }

    private UserResponseDto convertToUserResponse(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getGithubUsername(),
                user.getGithubEmail(),
                user.getProfileImageUrl(),
                user.getRewardPoints(),
                user.getUserGrade()
        );
    }
}
