package com.ssafy.ottereview.githubapp.service;

import com.ssafy.ottereview.githubapp.dto.GithubPrResponse;
import com.ssafy.ottereview.githubapp.dto.GithubRepoResponse;
import java.util.List;

public interface GithubApiService {

    List<GithubRepoResponse> getRepositories(Long installationId);
    List<GithubPrResponse> getPullRequests(Long installationId, String repositoryName);

}
