package com.ssafy.ottereview.preparation.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.ssafy.ottereview.preparation.dto.request.PreparationDescriptionRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class DescriptionInfo {
    
    private PrUserInfo author;
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
    
    public static DescriptionInfo fromRequest(PreparationDescriptionRequest request, PrUserInfo author) {
        return DescriptionInfo.builder()
                .author(author)
                .path(request.getPath())
                .body(request.getBody())
                .recordKey(request.getRecordKey())
                .fileIndex(request.getFileIndex())
                .position(request.getPosition())
                .startLine(request.getStartLine())
                .startSide(request.getStartSide())
                .line(request.getLine())
                .side(request.getSide())
                .diffHunk(request.getDiffHunk())
                .build();
    }
}
