package com.ssafy.ottereview.review.service;

import com.ssafy.ottereview.account.repository.AccountRepository;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.review.dto.GithubReviewResponse;
import com.ssafy.ottereview.review.dto.ReviewRequest;
import com.ssafy.ottereview.review.dto.ReviewResponse;
import com.ssafy.ottereview.review.entity.Review;
import com.ssafy.ottereview.review.repository.ReviewRepository;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentCreateRequest;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentResponse;
import com.ssafy.ottereview.reviewcomment.repository.ReviewCommentRepository;
import com.ssafy.ottereview.reviewcomment.service.ReviewCommentService;
import com.ssafy.ottereview.s3.service.S3Service;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
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
public class ReviewServiceImpl implements ReviewService {

    private final ReviewCommentRepository reviewCommentRepository;
    private final RepoRepository repoRepository;
    private final ReviewRepository reviewRepository;
    private final PullRequestRepository pullRequestRepository;
    private final UserRepository userRepository;
    private final ReviewCommentService reviewCommentService;
    private final ReviewGithubService reviewGithubService;
    private final AccountRepository accountRepository;
    private final S3Service s3Service;

    private static final String COMMENT_TEMPLATE = """
            **👀 Reviewer: @%s**
            %s
            """;


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
        List<ReviewCommentResponse> createdComments = new ArrayList<>();
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
        // GitHub API 호출
        String repoFullName = repoRepository.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Repository not found"))
                .getFullName();

        Long installationId = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"))
                .getInstallationId();

        GithubReviewResponse githubResult = reviewGithubService.createReviewOnGithub(
                installationId,
                repoFullName,
                pullRequest.getGithubPrNumber(),
                reviewRequest.getBody(),
                reviewRequest.getState(),
                reviewRequest.getReviewComments(),
                user.getGithubUsername()
        );

        // 깃허브 아이디 재설정
        savedReview.updateGithubId(githubResult.getReviewId());

        // body 기반으로 githubCommentId를 가져오기 위한 맵
        Map<String, Long> bodyToGithubCommentId = githubResult.getBodyToGithubCommentId();
        Map<Long, String> commentDiffs = githubResult.getCommentDiffs();
        Map<Long, Integer> commentPositions = githubResult.getCommentPositions();

        for (ReviewCommentResponse localComment : createdComments) {
            // 우리가 보낼 때 사용한 포맷과 동일하게 포맷팅
            String formattedBody = COMMENT_TEMPLATE.formatted(user.getGithubUsername(), localComment.getBody());

            Long githubCommentId = bodyToGithubCommentId.get(formattedBody);
            if (githubCommentId != null) {
                reviewCommentRepository.updateGithubId(localComment.getId(), githubCommentId);
                reviewCommentRepository.updateDiffHunk(localComment.getId(), commentDiffs.get(githubCommentId));
                reviewCommentRepository.updatePosition(localComment.getId(), commentPositions.get(githubCommentId));
            } else {
                log.warn("No matching GitHub comment for localCommentId={}, formattedBody={}", localComment.getId(), formattedBody);
            }
        }

        // 코멘트 response dto로 변경
        List<ReviewCommentResponse> updatedComments = reviewCommentRepository.findAllByReviewId(savedReview.getId()).stream()
                .map(ReviewCommentResponse::from)
                .toList();

        // ReviewResponse를 직접 생성 (DB 재조회 없이)
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
