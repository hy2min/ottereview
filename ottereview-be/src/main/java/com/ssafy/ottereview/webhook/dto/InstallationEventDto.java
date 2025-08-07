package com.ssafy.ottereview.webhook.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class InstallationEventDto {
    
    private String action;
    private InstallationDto installation;
    private List<RepositoryDto> repositories;
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class InstallationDto {
        
        private Long id;
        private AccountDto account;
        
        @JsonProperty("app_id")
        private Long appId;
        
        @JsonProperty("target_id")
        private Long targetId;
        
        @JsonProperty("target_type")
        private String targetType;
        
        @JsonProperty("created_at")
        private String createdAt;
        
        @JsonProperty("updated_at")
        private String updatedAt;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AccountDto {
        
        private Long id;
        private String login;
        private String type;
        
        @JsonProperty("avatar_url")
        private String avatarUrl;
        
        @JsonProperty("html_url")
        private String htmlUrl;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RepositoryDto {
        
        private Long id;
        
        @JsonProperty("full_name")
        private String fullName;
        
        @JsonProperty("private")
        private Boolean iaPrivate;
    }
}
