package com.ssafy.ottereview.ai.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrAnalysisResult {

    private String sessionId;
    private TitleResponse title;
    private SummaryResponse summary;
    private ReviewerResponse reviewers;
    private PriorityResponse priority;
    private ConventionResponse conventions;
    private LocalDateTime analysisTime;
    private boolean success;
    private String errorMessage;
}
