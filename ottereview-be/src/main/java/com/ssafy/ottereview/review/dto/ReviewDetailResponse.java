package com.ssafy.ottereview.review.dto;

import com.ssafy.ottereview.pullrequest.dto.info.PullRequestReviewCommentInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestReviewInfo;
import com.ssafy.ottereview.review.entity.Review;
import com.ssafy.ottereview.review.entity.ReviewState;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDetailResponse {
    
    private Long id;
    private Long userId;
    private String githubUsername;
    private String githubEmail;
    private ReviewState state;
    private String body;
    private String commitSha;
    private List<ReviewCommentDetailResponse> reviewComments;
    private LocalDateTime githubCreatedAt;
    private LocalDateTime createdAt;
    
    public static ReviewDetailResponse fromEntityAndReviewComment(Review review,
            List<ReviewCommentDetailResponse> reviewComments) {
        return ReviewDetailResponse.builder()
                .id(review.getId())
                .userId(review.getUser()
                        .getId())
                .githubUsername(review.getUser()
                        .getGithubUsername())
                .githubEmail(review.getUser()
                        .getGithubEmail())
                .state(review.getState())
                .body(review.getBody())
                .commitSha(review.getCommitSha())
                .reviewComments(reviewComments)
                .githubCreatedAt(review.getGithubCreatedAt())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
