package com.ssafy.ottereview.ai.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
public class AiResult {

    private AiTitleResponse title;
    private AiReviewerResponse reviewers;
    private AiPriorityResponse priority;
    private LocalDateTime analysisTime;
    private String errorMessage;
    private Boolean hasErrors;
}
