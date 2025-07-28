package com.ssafy.ottereview.repo.dto;

import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.repo.entity.Repo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class RepoResponse {
    private Long repoId;

    private String githubRepoName;

    private String githubOwnerUsername;

    private Account account;

    private boolean isCushion;

    private boolean isPrivate;

    public static RepoResponse of(Repo repo){
        return RepoResponse.builder()
                .repoId(repo.getId())
                .githubRepoName(repo.getGithubRepoName())
                .githubOwnerUsername(repo.getGithubOwnerUsername())
                .account(repo.getAccount())
                .isCushion(repo.isCushion())
                .isPrivate(repo.isPrivate())
                .build();
    }
}
