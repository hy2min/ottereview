package com.ssafy.ottereview.repo.dto;

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

    private Long id;

    private Long repoId;

    private String fullName;

    private Long accountId;

    private boolean isCushion;

    private boolean isPrivate;

    public static RepoResponse of(Repo repo) {
        return RepoResponse.builder()
                .id(repo.getId())
                .repoId(repo.getRepoId())
                .fullName(repo.getFullName())
                .accountId(repo.getAccount().getId())
                .isCushion(repo.isCushion())
                .isPrivate(repo.isPrivate())
                .build();
    }
}
