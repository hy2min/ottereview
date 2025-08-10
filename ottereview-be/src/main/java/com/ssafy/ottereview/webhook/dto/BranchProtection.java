package com.ssafy.ottereview.webhook.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Getter;

@Getter
public class BranchProtection {

    @JsonProperty("action")
    private String action;

    @JsonProperty("installation")
    private Installation installation;

    @JsonProperty("repository")
    private Repository repository;

    @JsonProperty("rule")
    private Rule rule;

    @Data
    public static class Installation {

        @JsonProperty("id")
        private Long id;
    }

    @Data
    public static class Repository {

        @JsonProperty("id")
        private Long repoId;
    }

    @Data
    public static class Rule {

        @JsonProperty("required_approving_review_count")
        private int requiredApprovingReviewCount;

        @JsonProperty("name")
        private String name;
    }



}
