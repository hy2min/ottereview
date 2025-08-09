package com.ssafy.ottereview.description.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class DescriptionCreateRequest {

    @NotNull
    private Long pullRequestId;

    @NotBlank
    private String path;

    private String body;

    private Integer position;

    private Integer line;

    private String side;

    private Integer startLine;

    private String startSide;
    
    private String diffHunk;
}