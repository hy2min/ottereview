package com.ssafy.ottereview.webhook.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Getter;

@Getter
public class BranchEventDto {

    @JsonProperty("ref")
    public String name;

    @JsonProperty("ref_type")
    public String refType;

    @JsonProperty("installation")
    public Installation installation;

    @JsonProperty("repository")
    public Repository repository;

    @Data
    public static class Installation {

        @JsonProperty("id")
        Long id;
    }

    @Data
    public static class Repository {

        @JsonProperty("id")
        private Long repoId;

        private String name;

        @JsonProperty("full_name")
        private String fullName;

        @JsonProperty("private")
        private Boolean isPrivate;


    }
}
