package com.ssafy.ottereview.priority.dto;

import com.ssafy.ottereview.priority.entity.Priority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreatePriorityRequest {
    private int idx;
    private String title;
    private String content;
    public static Priority to(CreatePriorityRequest createPriorityRequest){
        return Priority.builder()
                .idx(createPriorityRequest.getIdx())
                .title(createPriorityRequest.getTitle())
                .content(createPriorityRequest.getContent())
                .build();
    }
}
