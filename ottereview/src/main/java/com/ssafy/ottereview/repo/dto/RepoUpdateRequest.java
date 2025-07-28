package com.ssafy.ottereview.repo.dto;

import lombok.Builder;
import com.ssafy.ottereview.account.entity.Account;
import lombok.Getter;

@Builder
@Getter
public class RepoUpdateRequest {
    private Long id;

    private Long repoId;

    private Account account;

    private boolean isCushion;

    private boolean isPrivate;

}
