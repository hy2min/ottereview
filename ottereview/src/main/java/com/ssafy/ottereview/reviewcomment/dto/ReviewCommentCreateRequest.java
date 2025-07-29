package com.ssafy.ottereview.reviewcomment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class ReviewCommentCreateRequest {
    @NotBlank
    private String commitSha;

    @NotBlank
    private String filePath;

    @NotNull
    private Integer lineNumber;

    private String content;
}