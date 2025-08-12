package com.ssafy.ottereview.review.service;

import com.ssafy.ottereview.account.repository.AccountRepository;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.review.dto.GithubReviewResponse;
import com.ssafy.ottereview.review.dto.ReviewRequest;
import com.ssafy.ottereview.review.dto.ReviewResponse;
import com.ssafy.ottereview.review.entity.Review;
import com.ssafy.ottereview.review.entity.ReviewState;
import com.ssafy.ottereview.review.repository.ReviewRepository;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentCreateRequest;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentResponse;
import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
import com.ssafy.ottereview.reviewcomment.repository.ReviewCommentRepository;
import com.ssafy.ottereview.reviewcomment.service.ReviewCommentService;
import com.ssafy.ottereview.reviewer.entity.ReviewStatus;
import com.ssafy.ottereview.reviewer.entity.Reviewer;
import com.ssafy.ottereview.reviewer.repository.ReviewerRepository;
import com.ssafy.ottereview.s3.service.S3Service;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private static final String COMMENT_TEMPLATE = """
            **👀 Reviewer: @%s**
            %s
            """;
    private final ReviewCommentRepository reviewCommentRepository;
    private final RepoRepository repoRepository;
    private final ReviewRepository reviewRepository;
    private final PullRequestRepository pullRequestRepository;
    private final UserRepository userRepository;
    private final ReviewCommentService reviewCommentService;
    private final ReviewGithubService reviewGithubService;
    private final AccountRepository accountRepository;
    private final ReviewerRepository reviewerRepository;
    private final S3Service s3Service;

    @Override
    @Transactional
    public ReviewResponse createReviewWithFiles(Long accountId, Long repoId, Long prId,
                                                ReviewRequest reviewRequest, MultipartFile[] files, Long userId) {
        User user = findUser(userId);
        PullRequest pullRequest = findPullRequest(prId);

        Review savedReview = saveReview(reviewRequest, pullRequest, user);

        List<ReviewCommentResponse> createdComments = createReviewCommentsIfExists(savedReview.getId(), reviewRequest, files, userId);

        GithubReviewResponse githubResult = createReviewOnGithub(accountId, repoId, pullRequest, reviewRequest, user, savedReview.getId());

        if (reviewRequest.getState() == ReviewState.APPROVE || reviewRequest.getState() == ReviewState.REQUEST_CHANGES) {
            updateReviewerStatus(pullRequest, user, reviewRequest.getState());
        }

        updateGithubIdsForComments(savedReview, createdComments, githubResult, user);

        return buildReviewResponse(savedReview);
    }

    private void updateReviewerStatus(PullRequest pullRequest, User user, @NotNull ReviewState state) {
        Reviewer reviewer = (Reviewer) reviewerRepository.findByPullRequestAndUser(pullRequest, user)
                .orElse(null);
        if (reviewer == null) return;

        reviewer.updateStatus(
            switch (state) {
                case APPROVE -> ReviewStatus.APPROVED;
                case REQUEST_CHANGES -> ReviewStatus.CHANGES_REQUESTED;
                default -> reviewer.getStatus();
            }
        );
    }

//    @Override
//    @Transactional
//    public ReviewResponse updateReview(Long accountId, Long repoId, Long prId, Long reviewId,
//                                       ReviewRequest reviewRequest, Long userId) {
//        Review review = reviewRepository.findById(reviewId)
//                .orElseThrow(() -> new RuntimeException("Review not found: " + reviewId));
//
//        if (!review.getUser().getId().equals(userId)) {
//            throw new RuntimeException("You can only update your own reviews");
//        }
//
//        Review updatedReview = Review.builder()
//                .id(review.getId())
//                .pullRequest(review.getPullRequest())
//                .user(review.getUser())
//                .state(reviewRequest.getState())
//                .body(reviewRequest.getBody())
//                .commitSha(reviewRequest.getCommitSha() != null ? reviewRequest.getCommitSha()
//                        : review.getCommitSha())
//                .reviewComments(review.getReviewComments())
//                .githubCreatedAt(review.getGithubCreatedAt())
//                .build();
//
//        Review savedReview = reviewRepository.save(updatedReview);
//
//        return ReviewResponse.from(savedReview);
//    }
//
//    @Override
//    @Transactional
//    public void deleteReview(Long accountId, Long repoId, Long prId, Long reviewId, Long userId) {
//        Review review = reviewRepository.findById(reviewId)
//                .orElseThrow(() -> new RuntimeException("Review not found: " + reviewId));
//
//        if (!review.getUser().getId().equals(userId)) {
//            throw new RuntimeException("You can only delete your own reviews");
//        }
//
//        reviewRepository.delete(review);
//        s3Service.deleteFiles(reviewId);
//
//    }

    @Override
    public List<ReviewResponse> getReviewsByPullRequest(Long accountId, Long repoId, Long prId) {
        List<Review> reviews = reviewRepository.findByPullRequestId(prId);
        return reviews.stream()
                .map(this::buildReviewResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ReviewResponse getReviewById(Long accountId, Long repoId, Long prId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found: " + reviewId));

        return buildReviewResponse(review);
    }



    private ReviewCommentResponse buildReviewCommentWithVoiceUrl(ReviewComment comment) {
        ReviewCommentResponse response = ReviewCommentResponse.from(comment);
        
        log.debug("Processing review comment id: {}, recordKey: '{}'", comment.getId(), comment.getRecordKey());
        
        if (comment.getRecordKey() != null && !comment.getRecordKey().isEmpty()) {
            try {
                log.info("Generating presigned URL for recordKey: {}", comment.getRecordKey());
                String presignedUrl = s3Service.generatePresignedUrl(comment.getRecordKey(), 60);
                log.info("Generated presigned URL successfully for recordKey: {}", comment.getRecordKey());
                response = response.toBuilder()
                        .voiceFileUrl(presignedUrl)
                        .build();
            } catch (Exception e) {
                log.error("Failed to generate presigned URL for recordKey: {}, error: {}", 
                        comment.getRecordKey(), e.getMessage(), e);
            }
        } else {
            log.debug("RecordKey is null or empty for comment id: {}", comment.getId());
        }
        
        return response;
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
    }

    private PullRequest findPullRequest(Long prId) {
        return pullRequestRepository.findById(prId)
                .orElseThrow(() -> new RuntimeException("Pull request not found: " + prId));
    }

    private Review saveReview(ReviewRequest reviewRequest, PullRequest pullRequest, User user) {
        Review review = Review.builder()
                .pullRequest(pullRequest)
                .user(user)
                .state(reviewRequest.getState())
                .body(reviewRequest.getBody())
                .commitSha(reviewRequest.getCommitSha())
                .build();
        return reviewRepository.save(review);
    }

    private List<ReviewCommentResponse> createReviewCommentsIfExists(Long reviewId,
                                                                     ReviewRequest reviewRequest,
                                                                     MultipartFile[] files,
                                                                     Long userId) {
        if (reviewRequest.getReviewComments() == null || reviewRequest.getReviewComments().isEmpty()) {
            return new ArrayList<>();
        }

        ReviewCommentCreateRequest commentCreateRequest = ReviewCommentCreateRequest.builder()
                .comments(reviewRequest.getReviewComments())
                .build();

        return reviewCommentService.createComments(reviewId, commentCreateRequest, files, userId);
    }

    private GithubReviewResponse createReviewOnGithub(Long accountId,
                                                      Long repoId,
                                                      PullRequest pullRequest,
                                                      ReviewRequest reviewRequest,
                                                      User user,
                                                      Long reviewId) {
        String repoFullName = repoRepository.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Repository not found"))
                .getFullName();

        Long installationId = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"))
                .getInstallationId();

        List<ReviewCommentCreateRequest.CommentItem> commentItems =
                reviewCommentRepository.findByReviewId(reviewId).stream()
                        .map(comment -> ReviewCommentCreateRequest.CommentItem.builder()
                                .path(comment.getPath())
                                .body(comment.getBody())
                                .position(comment.getPosition())
                                .line(comment.getLine())
                                .side(comment.getSide())
                                .startLine(comment.getStartLine())
                                .startSide(comment.getStartSide())
                                .fileIndex(null)
                                .build()
                        )
                        .toList();


        return reviewGithubService.createReviewOnGithub(
                installationId,
                repoFullName,
                pullRequest.getGithubPrNumber(),
                reviewRequest.getBody(),
                reviewRequest.getState(),
                commentItems,
                user.getGithubUsername()
        );
    }

    private void updateGithubIdsForComments(Review savedReview,
                                            List<ReviewCommentResponse> createdComments,
                                            GithubReviewResponse githubResult,
                                            User user) {

        savedReview.updateGithubId(githubResult.getReviewId());

        Map<String, Long> bodyToGithubCommentId = githubResult.getBodyToGithubCommentId();
        Map<Long, String> commentDiffs = githubResult.getCommentDiffs();
        Map<Long, Integer> commentPositions = githubResult.getCommentPositions();

        for (ReviewCommentResponse localComment : createdComments) {
            String formattedBody = COMMENT_TEMPLATE.formatted(user.getGithubUsername(), localComment.getBody());

            Long githubCommentId = bodyToGithubCommentId.get(formattedBody);
            if (githubCommentId != null) {
                reviewCommentRepository.updateGithubId(localComment.getId(), githubCommentId);
                reviewCommentRepository.updateDiffHunk(localComment.getId(), commentDiffs.get(githubCommentId));
                reviewCommentRepository.updatePosition(localComment.getId(), commentPositions.get(githubCommentId));
            } else {
                log.warn("No matching GitHub comment for localCommentId={}, formattedBody={}",
                        localComment.getId(), formattedBody);
            }
        }
    }

    private ReviewResponse buildReviewResponse(Review savedReview) {
        List<ReviewCommentResponse> updatedComments = reviewCommentRepository.findAllByReviewId(savedReview.getId()).stream()
                .map(ReviewCommentResponse::from)
                .toList();

        return new ReviewResponse(
                savedReview.getId(),
                savedReview.getPullRequest().getId(),
                savedReview.getPullRequest().getGithubPrNumber(),
                savedReview.getUser().getGithubUsername(),
                savedReview.getState(),
                savedReview.getBody(),
                savedReview.getCommitSha(),
                updatedComments,
                savedReview.getGithubCreatedAt(),
                savedReview.getCreatedAt(),
                savedReview.getModifiedAt()
        );
    }


}
