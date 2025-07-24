package com.ssafy.ottereview.pullrequest.dto;

public record PullRequestCreateRequest(

        Long githubPrId,
        Long repoId,
        String title,
        String description,
        String summary,
        String headBranch,
        String baseBranch,
        String status,
        int approveCount,
        boolean mergeable
) {

}
