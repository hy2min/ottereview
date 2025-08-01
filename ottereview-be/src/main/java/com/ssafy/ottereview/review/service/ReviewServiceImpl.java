package com.ssafy.ottereview.review.service;

import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.review.dto.ReviewRequest;
import com.ssafy.ottereview.review.dto.ReviewResponse;
import com.ssafy.ottereview.review.entity.Review;
import com.ssafy.ottereview.review.repository.ReviewRepository;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentCreateRequest;
import com.ssafy.ottereview.reviewcomment.service.ReviewCommentService;
import com.ssafy.ottereview.s3.service.S3Service;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final PullRequestRepository pullRequestRepository;
    private final UserRepository userRepository;
    private final ReviewCommentService reviewCommentService;
    private final S3Service s3Service;

//    @Override
//    @Transactional
//    public ReviewResponse createReview(Long accountId, Long repoId, Long prId,
//            ReviewRequest reviewRequest, Long userId) {
//        User user = userRepository.findById(userId)
//                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
//
//        PullRequest pullRequest = pullRequestRepository.findById(prId)
//                .orElseThrow(() -> new RuntimeException("Pull request not found: " + prId));
//
//        Review review = Review.builder()
//                .pullRequest(pullRequest)
//                .user(user)
//                .state(reviewRequest.getState())
//                .body(reviewRequest.getBody())
//                .commitSha(reviewRequest.getCommitSha())
//                .build();
//
//        // Review 먼저 저장하여 ID 확보
//        Review savedReview = reviewRepository.save(review);
//
//        // ReviewComment들이 있으면 ReviewCommentService를 통해 생성
//        List<com.ssafy.ottereview.reviewcomment.dto.ReviewCommentResponse> createdComments = new ArrayList<>();
//        if (reviewRequest.getReviewComments() != null && !reviewRequest.getReviewComments()
//                .isEmpty()) {
//            ReviewCommentCreateRequest commentCreateRequest = ReviewCommentCreateRequest.builder()
//                    .comments(reviewRequest.getReviewComments())
//                    .build();
//
//            // ReviewCommentService의 createComments 메소드 사용하고 결과 받기
//            createdComments = reviewCommentService.createComments(
//                    savedReview.getId(),
//                    commentCreateRequest,
//                    null, // 파일 없음
//                    userId
//            );
//        }
//
//        // ReviewResponse를 직접 생성 (DB 재조회 없이)
//        return new ReviewResponse(
//                savedReview.getId(),
//                savedReview.getPullRequest().getId(),
//                savedReview.getUser().getGithubUsername(),
//                savedReview.getState(),
//                savedReview.getBody(),
//                savedReview.getCommitSha(),
//                createdComments,
//                savedReview.getGithubCreatedAt(),
//                savedReview.getCreatedAt(),
//                savedReview.getCreatedAt()
//        );
//    }

    @Override
    @Transactional
    public ReviewResponse createReviewWithFiles(Long accountId, Long repoId, Long prId,
            ReviewRequest reviewRequest, MultipartFile[] files, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        PullRequest pullRequest = pullRequestRepository.findById(prId)
                .orElseThrow(() -> new RuntimeException("Pull request not found: " + prId));

        Review review = Review.builder()
                .pullRequest(pullRequest)
                .user(user)
                .state(reviewRequest.getState())
                .body(reviewRequest.getBody())
                .commitSha(reviewRequest.getCommitSha())
                .build();

        // Review 먼저 저장하여 ID 확보
        Review savedReview = reviewRepository.save(review);

        // ReviewComment들이 있으면 ReviewCommentService를 통해 생성 (파일 포함)
        List<com.ssafy.ottereview.reviewcomment.dto.ReviewCommentResponse> createdComments = new ArrayList<>();
        if (reviewRequest.getReviewComments() != null && !reviewRequest.getReviewComments()
                .isEmpty()) {
            ReviewCommentCreateRequest commentCreateRequest = ReviewCommentCreateRequest.builder()
                    .comments(reviewRequest.getReviewComments())
                    .build();

            // ReviewCommentService의 createComments 메소드 사용하고 결과 받기 (파일 포함)
            createdComments = reviewCommentService.createComments(
                    savedReview.getId(),
                    commentCreateRequest,
                    files, // 파일 배열 전달
                    userId
            );
        }

        // ReviewResponse를 직접 생성 (DB 재조회 없이)
        return new com.ssafy.ottereview.review.dto.ReviewResponse(
                savedReview.getId(),
                savedReview.getPullRequest().getId(),
                savedReview.getUser().getGithubUsername(),
                savedReview.getState(),
                savedReview.getBody(),
                savedReview.getCommitSha(),
                createdComments,
                savedReview.getGithubCreatedAt(),
                savedReview.getCreatedAt(),
                savedReview.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long accountId, Long repoId, Long prId, Long reviewId,
            ReviewRequest reviewRequest, Long userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found: " + reviewId));

        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only update your own reviews");
        }

        Review updatedReview = Review.builder()
                .id(review.getId())
                .pullRequest(review.getPullRequest())
                .user(review.getUser())
                .state(reviewRequest.getState())
                .body(reviewRequest.getBody())
                .commitSha(reviewRequest.getCommitSha() != null ? reviewRequest.getCommitSha()
                        : review.getCommitSha())
                .reviewComments(review.getReviewComments())
                .githubCreatedAt(review.getGithubCreatedAt())
                .build();

        Review savedReview = reviewRepository.save(updatedReview);
        return ReviewResponse.from(savedReview);
    }

    @Override
    @Transactional
    public void deleteReview(Long accountId, Long repoId, Long prId, Long reviewId, Long userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found: " + reviewId));

        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own reviews");
        }

        reviewRepository.delete(review);
        s3Service.deleteFiles(reviewId);
    }

    @Override
    public List<ReviewResponse> getReviewsByPullRequest(Long accountId, Long repoId, Long prId) {
        List<Review> reviews = reviewRepository.findByPullRequestId(prId);
        return reviews.stream()
                .map(ReviewResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public ReviewResponse getReviewById(Long accountId, Long repoId, Long prId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found: " + reviewId));

        return ReviewResponse.from(review);
    }


}
