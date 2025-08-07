package com.ssafy.ottereview.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@JsonIgnoreProperties(ignoreUnknown = true)
public class PriorityResponse {

    private PriorityResult result;

    // PriorityResult를 static inner class로 정의
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PriorityResult {

        private List<PriorityItem> priority;
    }

    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PriorityItem {

        private String title;

        @JsonProperty("priority_level")
        private String priorityLevel;

        private String reason;
    }
}
