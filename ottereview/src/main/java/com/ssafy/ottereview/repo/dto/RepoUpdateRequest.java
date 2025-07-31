package com.ssafy.ottereview.repo.dto;

import com.ssafy.ottereview.account.entity.Account;
import lombok.Builder;
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
