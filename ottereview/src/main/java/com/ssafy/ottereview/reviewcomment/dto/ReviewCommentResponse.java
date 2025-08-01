package com.ssafy.ottereview.reviewcomment.dto;

import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class ReviewCommentResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Long review;
    private String path;
    private String body;
    private String recordKey;
    private Integer position;
    private LocalDateTime githubCreatedAt;
    private LocalDateTime githubUpdatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public static ReviewCommentResponse from(ReviewComment comment) {
        return ReviewCommentResponse.builder()
                .id(comment.getId())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getGithubUsername())
                .review(comment.getReview().getId())
                .path(comment.getPath())
                .body(comment.getBody())
                .recordKey(comment.getRecordKey())
                .position(comment.getPosition())
                .githubCreatedAt(comment.getGithubCreatedAt())
                .githubUpdatedAt(comment.getGithubUpdatedAt())
                .createdAt(comment.getCreatedAt())
                .modifiedAt(comment.getModifiedAt())
                .build();
    }
}