package com.ssafy.ottereview.repo.dto;

import lombok.Getter;

@Getter
public class RepoCreateRequest {

    private String githubRepoName;

    private String githubOwnerUsername;

    private boolean isPrivate;

}
