package com.ssafy.ottereview.webhook.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReviewCommentEventDto {
    private String action;
    private ReviewCommentInfo comment;
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewCommentInfo {
        private Long id;
        
        @JsonProperty("pull_request_review_id")
        private Long pullRequestReviewId;
        
        @JsonProperty("node_id")
        private String nodeId;
        
        @JsonProperty("diff_hunk")
        private String diffHunk;
        
        private String path;
        
        @JsonProperty("commit_id")
        private String commitId;
        
        @JsonProperty("original_commit_id")
        private String originalCommitId;
        
        private UserWebhookInfo user;
        private String body;
        
        @JsonProperty("created_at")
        private LocalDateTime createdAt;
        
        @JsonProperty("updated_at")
        private LocalDateTime updatedAt;
        
        @JsonProperty("html_url")
        private String htmlUrl;
        
        @JsonProperty("pull_request_url")
        private String pullRequestUrl;
        
        @JsonProperty("author_association")
        private String authorAssociation;
        
        // 위치 관련 정보
        @JsonProperty("start_line")
        private Integer startLine;
        
        @JsonProperty("original_start_line")
        private Integer originalStartLine;
        
        @JsonProperty("start_side")
        private String startSide;
        
        private Integer line;
        
        @JsonProperty("original_line")
        private Integer originalLine;
        
        private String side; // "LEFT" or "RIGHT"
        
        @JsonProperty("original_position")
        private Integer originalPosition;
        
        private Integer position;
        
        @JsonProperty("subject_type")
        private String subjectType;
    }
    
}
