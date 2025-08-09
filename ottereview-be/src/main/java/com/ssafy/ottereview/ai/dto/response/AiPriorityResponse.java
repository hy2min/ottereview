package com.ssafy.ottereview.ai.dto.response;

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
public class AiPriorityResponse {

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
    
    public static AiPriorityResponse createDefaultPriorityResponse() {
        AiPriorityResponse.PriorityItem defaultItem = AiPriorityResponse.PriorityItem.builder()
                .title("기본 우선순위")
                .priorityLevel("MEDIUM")
                .reason("우선순위를 수동으로 설정해주세요")
                .build();
        
        return AiPriorityResponse.builder()
                .result(AiPriorityResponse.PriorityResult.builder()
                        .priority(List.of(defaultItem))
                        .build())
                .build();
    }
}
