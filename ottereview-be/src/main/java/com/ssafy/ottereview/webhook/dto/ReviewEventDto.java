package com.ssafy.ottereview.webhook.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Data
public class ReviewEventDto {
    
    private String action;
    private ReviewDto review;
    
    @JsonProperty("pull_request")
    private PullRequestWebhookInfo pullRequest;
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewDto {
        
        private Long id;
        
        @JsonProperty("node_id")
        private String nodeId;
        
        private UserWebhookInfo user;
        private String body;
        
        @JsonProperty("commit_id")
        private String commitId;
        
        @JsonProperty("submitted_at")
        private LocalDateTime submittedAt;
        
        private String state;
        
        @JsonProperty("html_url")
        private String htmlUrl;
        
        @JsonProperty("pull_request_url")
        private String pullRequestUrl;
        
        @JsonProperty("author_association")
        private String authorAssociation;
    }
}
