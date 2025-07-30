package com.ssafy.ottereview.review.service;

import com.ssafy.ottereview.review.dto.ReviewRequest;
import com.ssafy.ottereview.review.dto.ReviewResponse;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface ReviewService {

    ReviewResponse createReview(Long accountId, Long repoId, Long prId, ReviewRequest reviewRequest,
            Long userId);

    ReviewResponse createReviewWithFiles(Long accountId, Long repoId, Long prId,
            ReviewRequest reviewRequest, MultipartFile[] files, Long userId);

    ReviewResponse updateReview(Long accountId, Long repoId, Long prId, Long reviewId,
            ReviewRequest reviewRequest, Long userId);

    void deleteReview(Long accountId, Long repoId, Long prId, Long reviewId, Long userId);

    List<ReviewResponse> getReviewsByPullRequest(Long accountId, Long repoId, Long prId);

    ReviewResponse getReviewById(Long accountId, Long repoId, Long prId, Long reviewId);
}
