package com.ssafy.ottereview.webhook.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.ssafy.ottereview.common.util.GitHubTimeDeserializer;
import com.ssafy.ottereview.webhook.dto.PullRequestEventDto.BranchInfo;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
public class PullRequestWebhookInfo {
    
    private Long id;
    
    @JsonProperty("title")
    private String title;
    
    @JsonProperty("body")
    private String body;
    
    @JsonProperty("state")
    private String state;
    
    @JsonProperty("merged")
    private Boolean merged;
    
    @JsonProperty("mergeable")
    private Boolean mergeable;
    
    @JsonProperty("created_at")
    @JsonDeserialize(using = GitHubTimeDeserializer.class)
    private LocalDateTime createdAt;
    
    @JsonProperty("updated_at")
    @JsonDeserialize(using = GitHubTimeDeserializer.class)
    private LocalDateTime updatedAt;
    
    @JsonProperty("commits")
    private Integer commits;
    
    @JsonProperty("changed_files")
    private Integer changedFiles;
    
    @JsonProperty("comments")
    private Integer comments;
    
    @JsonProperty("review_comments")
    private Integer reviewComments;
    
    @JsonProperty("html_url")
    private URL htmlUrl;
    
    @JsonProperty("patch_url")
    private URL patchUrl;
    
    @JsonProperty("issue_url")
    private URL issueUrl;
    
    @JsonProperty("diff_url")
    private URL diffUrl;
    
    @JsonProperty("user")
    private UserWebhookInfo user;
    
    @JsonProperty("base")
    private BranchInfo base;
    
    @JsonProperty("head")
    private BranchInfo head;
    
    @JsonProperty("requested_reviewers")
    private List<UserWebhookInfo> requestedReviewers;
}
