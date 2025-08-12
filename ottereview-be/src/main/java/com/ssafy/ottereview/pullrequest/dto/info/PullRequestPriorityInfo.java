package com.ssafy.ottereview.pullrequest.dto.info;

import com.ssafy.ottereview.priority.entity.Priority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PullRequestPriorityInfo {
    
    private Long id;
    private String level;
    private String title;
    private String content;
    
    public static PullRequestPriorityInfo fromEntity(Priority priority) {
        
        return PullRequestPriorityInfo.builder()
                .id(priority.getId())
                .level(priority.getLevel())
                .title(priority.getTitle())
                .content(priority.getContent())
                .build();
    }
}
