package com.ssafy.ottereview.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GithubReviewResponse {
    private Long reviewId;
    private List<Long> commentIds;
    private Map<Long, String> commentDiffs;
    private Map<Long, Integer> commentPositions;
    private Map<String, Long> bodyToGithubCommentId; // 깃허브에서 id를 일관적으로 넘겨준다는 보장이 안되므로 comment 내용과 연결
}
