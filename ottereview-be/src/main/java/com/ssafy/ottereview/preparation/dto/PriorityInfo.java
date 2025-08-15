package com.ssafy.ottereview.preparation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ssafy.ottereview.preparation.dto.request.PreparationPriorityRequest;
import com.ssafy.ottereview.priority.entity.Priority;
import java.util.List;
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

    @JsonProperty("related_files")
    private List<String> relatedFiles;
    
    public static PriorityInfo fromRequest(PreparationPriorityRequest request) {
        return PriorityInfo.builder()
                .level(request.getLevel())
                .title(request.getTitle())
                .content(request.getContent())
                .relatedFiles(request.getRelatedFiles())
                .build();
    }
}
