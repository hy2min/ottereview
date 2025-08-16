package com.ssafy.ottereview.webhook.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
public class PullRequestEventDto {

    @JsonProperty("action")
    private String action;

    @JsonProperty("number")
    private Integer number;

    @JsonProperty("pull_request")
    private PullRequestWebhookInfo pullRequest;

    @JsonProperty("repository")
    private RepositoryInfo repository;
    
    private String before;
    private String after;
    
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Builder
    public static class BranchInfo {
        @JsonProperty("ref")
        private String ref;

        @JsonProperty("sha")
        private String sha;

        @JsonProperty("label")
        private String label;
    }

    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Builder
    public static class RepositoryInfo {
        @JsonProperty("id")
        private Long id;

        @JsonProperty("name")
        private String name;

        @JsonProperty("full_name")
        private String fullName;

        @JsonProperty("html_url")
        private String htmlUrl;

        @JsonProperty("clone_url")
        private String cloneUrl;

        @JsonProperty("owner")
        private UserWebhookInfo owner;
    }
    @JsonProperty("sender")
    private Sender sender;

    @Data
    @Getter
    public static class Sender{
        @JsonProperty("id")
        private Long id;
    }
}
