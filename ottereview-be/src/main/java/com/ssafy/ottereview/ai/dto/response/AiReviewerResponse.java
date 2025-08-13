package com.ssafy.ottereview.ai.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.ssafy.ottereview.ai.dto.response.AiPriorityResponse.PriorityItem;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class AiReviewerResponse {

    private List<ReviewerResult> result;

    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class ReviewerResult {

        private Long githubId;
        private String githubUsername;
        private String githubEmail;
        private String reason;
    }
}
