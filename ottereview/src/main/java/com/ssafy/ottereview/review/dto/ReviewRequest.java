package com.ssafy.ottereview.review.dto;

import com.ssafy.ottereview.review.entity.ReviewState;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequest {

    @NotNull
    private ReviewState state;

    private String body;

    private String commitSha;

    @Valid
    private List<com.ssafy.ottereview.reviewcomment.dto.ReviewCommentCreateRequest.CommentItem> reviewComments;
}