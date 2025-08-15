package com.ssafy.ottereview.review.controller;

import com.ssafy.ottereview.common.annotation.MvcController;
import com.ssafy.ottereview.review.dto.ReviewDetailResponse;
import com.ssafy.ottereview.review.dto.ReviewRequest;
import com.ssafy.ottereview.review.dto.ReviewResponse;
import com.ssafy.ottereview.review.service.ReviewService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/accounts/{account-id}/repositories/{repo-id}/pull-requests/{pr-id}/review")
@RequiredArgsConstructor
@Slf4j
@MvcController
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping(consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable("account-id") Long accountId,
            @PathVariable("repo-id") Long repoId,
            @PathVariable("pr-id") Long prId,
            @RequestPart @Valid ReviewRequest reviewRequest,
            @RequestPart(value = "files", required = false) MultipartFile[] files,
            @AuthenticationPrincipal CustomUserDetail userDetail) {

        try {
            ReviewResponse response = reviewService.createReviewWithFiles(
                    accountId, repoId, prId, reviewRequest, files, userDetail.getUser().getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Failed to create review for PR #{}", prId, e);
            throw new RuntimeException("Failed to create review: " + e.getMessage());
        }
    }

//    @PutMapping("/{review-id}")
//    public ResponseEntity<ReviewResponse> updateReview(
//            @PathVariable("account-id") Long accountId,
//            @PathVariable("repo-id") Long repoId,
//            @PathVariable("pr-id") Long prId,
//            @PathVariable("review-id") Long reviewId,
//            @Valid @RequestBody ReviewRequest reviewRequest,
//            @AuthenticationPrincipal CustomUserDetail userDetail) {
//
//        try {
//            ReviewResponse response = reviewService.updateReview(
//                    accountId, repoId, prId, reviewId, reviewRequest, userDetail.getUser().getId());
//            return ResponseEntity.ok(response);
//        } catch (Exception e) {
//            log.error("Failed to update review {} for PR #{}", reviewId, prId, e);
//            throw new RuntimeException("Failed to update review: " + e.getMessage());
//        }
//    }
//
//    @DeleteMapping("/{review-id}")
//    public ResponseEntity<Void> deleteReview(
//            @PathVariable("account-id") Long accountId,
//            @PathVariable("repo-id") Long repoId,
//            @PathVariable("pr-id") Long prId,
//            @PathVariable("review-id") Long reviewId,
//            @AuthenticationPrincipal CustomUserDetail userDetail) {
//
//        try {
//            reviewService.deleteReview(accountId, repoId, prId, reviewId,
//                    userDetail.getUser().getId());
//            return ResponseEntity.noContent().build();
//        } catch (Exception e) {
//            log.error("Failed to delete review {} for PR #{}", reviewId, prId, e);
//            throw new RuntimeException("Failed to delete review: " + e.getMessage());
//        }
//    }

    @GetMapping
    public ResponseEntity<List<ReviewDetailResponse>> getReviewsByPullRequest(
            @PathVariable("account-id") Long accountId,
            @PathVariable("repo-id") Long repoId,
            @PathVariable("pr-id") Long prId) {

        try {
            List<ReviewDetailResponse> reviews = reviewService.getReviewsByPullRequest(accountId, repoId,
                    prId);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            log.error("Failed to get reviews for PR #{}", prId, e);
            throw new RuntimeException("Failed to get reviews: " + e.getMessage());
        }
    }

    @GetMapping("/{review-id}")
    public ResponseEntity<ReviewResponse> getReviewById(
            @PathVariable("account-id") Long accountId,
            @PathVariable("repo-id") Long repoId,
            @PathVariable("pr-id") Long prId,
            @PathVariable("review-id") Long reviewId) {

        try {
            ReviewResponse review = reviewService.getReviewById(accountId, repoId, prId, reviewId);
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            log.error("Failed to get review {} for PR #{}", reviewId, prId, e);
            throw new RuntimeException("Failed to get review: " + e.getMessage());
        }
    }
}
