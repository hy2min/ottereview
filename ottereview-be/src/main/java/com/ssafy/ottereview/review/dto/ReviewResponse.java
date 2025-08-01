package com.ssafy.ottereview.review.dto;

import com.ssafy.ottereview.review.entity.Review;
import com.ssafy.ottereview.review.entity.ReviewState;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private Long id;
    private Long pullRequestId;
    private String userGithubUsername;
    private ReviewState state;
    private String body;
    private String commitSha;
    private List<com.ssafy.ottereview.reviewcomment.dto.ReviewCommentResponse> reviewComments;
    private LocalDateTime githubCreatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getPullRequest().getId(),
                review.getUser().getGithubUsername(),
                review.getState(),
                review.getBody(),
                review.getCommitSha(),
                review.getReviewComments().stream()
                        .map(comment -> ReviewCommentResponse.from(
                                comment))
                        .collect(Collectors.toList()),
                review.getGithubCreatedAt(),
                review.getCreatedAt(),
                review.getModifiedAt()
        );
    }
}