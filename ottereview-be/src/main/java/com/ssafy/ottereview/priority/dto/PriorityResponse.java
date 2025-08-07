package com.ssafy.ottereview.priority.dto;

import com.ssafy.ottereview.priority.entity.Priority;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PriorityResponse {
    private Long id;
    private int idx;
    private String title;
    private String content;
    private PullRequest pullRequest;

    public static Priority of(PriorityResponse priorityResponse){
        return Priority.builder()
                .idx(priorityResponse.getIdx())
                .content(priorityResponse.getContent())
                .title(priorityResponse.getTitle())
                .pullRequest(priorityResponse.getPullRequest())
                .build();
    }

    public static PriorityResponse fromEntity(Priority priority){
        return PriorityResponse.builder()
                .id(priority.getId())
                .idx(priority.getIdx())
                .title(priority.getTitle())
                .content(priority.getContent())
                .pullRequest(priority.getPullRequest())
                .build();
    }
}
