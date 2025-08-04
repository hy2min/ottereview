package com.ssafy.ottereview.githubapp.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.kohsuke.github.GHRepository;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class GithubRepoResponse {
    private Long repoId;

    public static GithubRepoResponse from(GHRepository gHRepository) {
        return new GithubRepoResponse(gHRepository.getId());
    }
}
