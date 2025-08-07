package com.ssafy.ottereview.webhook.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class RepositoryEventDto {
    
    @JsonProperty("action")
    private String action;
    
    @JsonProperty("repositories_removed")
    private List<RepositoryInfo> repositoriesRemoved;
    
    @Data
    @NoArgsConstructor
    public static class RepositoryInfo {
        
        @JsonProperty("id")
        private Long id;
        
        @JsonProperty("node_id")
        private String nodeId;
        
        @JsonProperty("name")
        private String name;
        
        @JsonProperty("full_name")
        private String fullName;
        
        @JsonProperty("private")
        private Boolean isPrivate;
    }
}
