package com.ssafy.ottereview.ai.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class AiRequest {
    
    @JsonProperty("repo_id")
    private Long repoId;
    private String source;
    private String target;
}
