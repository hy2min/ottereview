package com.ssafy.ottereview.repo.dto;

import java.util.Objects;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class RepoCreateRequest {

    private String githubRepoName;

    private String githubOwnerUsername;

    private boolean isPrivate;

    private long installationId;

    @Override
    public boolean equals(Object o){
        if (this == o) return true;                        // 1) 동일 참조 체크
        if (o == null || getClass() != o.getClass()) return false;  // 2) 타입 체크\
        RepoCreateRequest repoCR = (RepoCreateRequest) o;
        return this.githubOwnerUsername.equals(repoCR.getGithubOwnerUsername())
                && this.githubRepoName.equals(repoCR.getGithubRepoName());
    }
    @Override
    public int hashCode() {
        return Objects.hash(this.githubOwnerUsername, this.githubRepoName);
    }
}
