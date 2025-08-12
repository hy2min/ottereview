package com.ssafy.ottereview.webhook.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RepoEventDto {
    private String action;
    @JsonProperty("repository")
    private Repository repository;

    @Getter
    public static class Repository{
        @JsonProperty("id")
        private Long repoId;

        @JsonProperty("private")
        private boolean isPrivate;
    }
}
