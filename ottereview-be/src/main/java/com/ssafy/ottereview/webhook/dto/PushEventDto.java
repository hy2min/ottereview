package com.ssafy.ottereview.webhook.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PushEventDto {
    
    @JsonProperty("ref")
    private String ref;
    
    @JsonProperty("before")
    private String before;
    
    @JsonProperty("after")
    private String after;
    
    @JsonProperty("forced")
    private boolean forced;
    
    @JsonProperty("created")
    private boolean created;
    
    @JsonProperty("deleted")
    private boolean deleted;
    
    @JsonProperty("commits")
    private List<CommitInfo> commits;
    
    @JsonProperty("repository")
    private RepositoryInfo repository;
    
    @JsonProperty("pusher")
    private PusherInfo pusher;
    
    @JsonProperty("sender")
    private SenderInfo sender;
    
    @JsonProperty("installation")
    private InstallationInfo installation;
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommitInfo {
        @JsonProperty("id")
        private String id;
        
        @JsonProperty("message")
        private String message;
        
        @JsonProperty("author")
        private AuthorInfo author;
    }
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthorInfo {
        @JsonProperty("name")
        private String name;
        
        @JsonProperty("email")
        private String email;
    }
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RepositoryInfo {
        @JsonProperty("id")
        private Long id;
        
        @JsonProperty("name")
        private String name;
        
        @JsonProperty("full_name")
        private String fullName;
        
        @JsonProperty("default_branch")
        private String defaultBranch;
        
        @JsonProperty("owner")
        private UserWebhookInfo owner;
    }
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PusherInfo {
        @JsonProperty("name")
        private String name;
        
        @JsonProperty("email")
        private String email;
    }
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SenderInfo {
        @JsonProperty("id")
        private Long id;
        
        @JsonProperty("login")
        private String login;
    }
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InstallationInfo {
        @JsonProperty("id")
        private Long id;
    }
    
    public String getBranchName() {
        return ref != null ? ref.replace("refs/heads/", "") : null;
    }
}
