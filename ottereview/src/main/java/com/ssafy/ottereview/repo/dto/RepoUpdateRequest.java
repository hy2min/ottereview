package com.ssafy.ottereview.repo.dto;

import lombok.Getter;

@Getter
public class RepoUpdateRequest {

    private Long repoId;

    private Long installationId;

    private boolean isCushion;

    private boolean isPrivate;

}
