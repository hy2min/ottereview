package com.ssafy.ottereview.preparation.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class PreparationDescriptionRequest {
    
    private Long authorId;
    private String path;
    private String body;
    private String recordKey;
    private Integer fileIndex;
    private Integer position;
    private Integer startLine;
    private String startSide;
    private Integer line;
    private String side;
    private String diffHunk;
}
