package com.ssafy.ottereview.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GithubReviewResult {
    private Long reviewId;
    private List<Long> commentIds;
}
