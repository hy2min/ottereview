package com.ssafy.ottereview.reviewcomment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class ReviewCommentCreateRequest {

    @NotEmpty
    @Valid
    private List<CommentItem> comments;

    @Builder
    @Getter
    public static class CommentItem {

        @NotBlank
        private String path;

        private String body;

        private Integer position;

        // 파일 인덱스 (files 배열에서의 위치, 없으면 null)
        private Integer fileIndex;
    }
}