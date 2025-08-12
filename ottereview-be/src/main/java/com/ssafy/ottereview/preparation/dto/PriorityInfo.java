package com.ssafy.ottereview.preparation.dto;

import com.ssafy.ottereview.preparation.dto.request.PreparationPriorityRequest;
import com.ssafy.ottereview.priority.entity.Priority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriorityInfo {

    private String level;
    private String title;
    private String content;
    
    public static PriorityInfo from(Priority priority) {
        return PriorityInfo.builder()
                .level(priority.getLevel())
                .title(priority.getTitle())
                .content(priority.getContent())
                .build();
    }
    
    public static PriorityInfo fromRequest(PreparationPriorityRequest request) {
        return PriorityInfo.builder()
                .level(request.getLevel())
                .title(request.getTitle())
                .content(request.getContent())
                .build();
    }
}
