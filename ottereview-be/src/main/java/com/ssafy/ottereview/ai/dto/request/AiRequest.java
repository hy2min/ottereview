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
    private AiRequest.Rule rules;
    
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    public static class Rule {
        
        @JsonProperty("file_name")
        private String fileName;
        
        @JsonProperty("variable_names")
        private String variableNames;
        
        @JsonProperty("class_names")
        private String classNames;
        
        @JsonProperty("constant_names")
        private String constantNames;
    }
}
