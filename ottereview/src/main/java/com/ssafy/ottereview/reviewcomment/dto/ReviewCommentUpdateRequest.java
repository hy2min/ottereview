package com.ssafy.ottereview.reviewcomment.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class ReviewCommentUpdateRequest {
    private String content;
}
