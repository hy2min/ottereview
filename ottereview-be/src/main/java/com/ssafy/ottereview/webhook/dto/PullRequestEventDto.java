package com.ssafy.ottereview.webhook.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ssafy.ottereview.pullrequest.entity.PrState;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
public class PullRequestEventDto {

    @JsonProperty("action")
    private String action;

    @JsonProperty("number")
    private Integer number;

    @JsonProperty("pull_request")
    private PullRequestWebhookInfo pullRequest;

    @JsonProperty("repository")
    private RepositoryInfo repository;

    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Builder
    public static class BranchInfo {
        @JsonProperty("ref")
        private String ref;

        @JsonProperty("sha")
        private String sha;

        @JsonProperty("label")
        private String label;
    }

    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Builder
    public static class RepositoryInfo {
        @JsonProperty("id")
        private Long id;

        @JsonProperty("name")
        private String name;

        @JsonProperty("full_name")
        private String fullName;

        @JsonProperty("html_url")
        private String htmlUrl;

        @JsonProperty("clone_url")
        private String cloneUrl;

        @JsonProperty("owner")
        private UserWebhookInfo owner;
    }

    // Entity에서 사용할 GithubPrResponse로 변환하는 메서드
    public PullRequest toPullRequestEntity(Repo repo, User author) {
        return PullRequest.builder()
                .githubPrNumber(this.getNumber())
                .repo(repo)
                .title(this.pullRequest.getTitle())
                .body(this.pullRequest.getBody())
                .state(PrState.fromGithubState(this.pullRequest.getState(), this.pullRequest.getMerged()))
                .author(author)
                .merged(this.pullRequest.getMerged() != null ? this.pullRequest.getMerged() : false)
                .base(this.pullRequest.getBase().getRef())
                .head(this.pullRequest.getHead().getRef())
                .mergeable(this.pullRequest.getMergeable() != null ? this.pullRequest.getMergeable() : false)
                .githubCreatedAt(this.pullRequest.getCreatedAt())
                .githubUpdatedAt(this.pullRequest.getUpdatedAt())
                .commitCnt(this.pullRequest.getCommits())
                .changedFilesCnt(this.pullRequest.getChangedFiles())
                .commentCnt(this.pullRequest.getComments())
                .reviewCommentCnt(this.pullRequest.getReviewComments())
                .htmlUrl(this.pullRequest.getHtmlUrl())
                .patchUrl(this.pullRequest.getPatchUrl())
                .issueUrl(this.pullRequest.getIssueUrl())
                .diffUrl(this.pullRequest.getDiffUrl())
                .approveCnt(0) // 초기값 0, 별도 API 호출로 업데이트 필요
                .build();
    }
}
