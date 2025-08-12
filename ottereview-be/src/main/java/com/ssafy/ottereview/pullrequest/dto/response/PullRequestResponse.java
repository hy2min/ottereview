package com.ssafy.ottereview.pullrequest.dto.response;

import com.ssafy.ottereview.preparation.dto.PrUserInfo;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PullRequestResponse {

    // 식별자
    private Long id;
    private Integer githubPrNumber;
    private Long githubId;
    private String commitSha;
    private String title;
    private String body;
    private String summary;
    private Integer approveCnt;
    private String state;
    private Boolean merged;
    private Boolean mergeable;
    private Boolean isApproved;

    // 브랜치 정보
    private String head;
    private String base;

    // 통계 정보
    private Integer commitCnt;
    private Integer changedFilesCnt;
    private Integer commentCnt;
    private Integer reviewCommentCnt;

    // GitHub에서의 생성 및 수정 일시
    private LocalDateTime githubCreatedAt;
    private LocalDateTime githubUpdatedAt;

    private RepoResponse repo;
    private PrUserInfo author;
    
    public static PullRequestResponse fromEntity(PullRequest pullRequest) {
        return PullRequestResponse.builder()
                .id(pullRequest.getId())
                .githubPrNumber(pullRequest.getGithubPrNumber())
                .githubId(pullRequest.getGithubId())
                .commitSha(pullRequest.getCommitSha())
                .title(pullRequest.getTitle())
                .body(pullRequest.getBody())
                .summary(pullRequest.getSummary())
                .approveCnt(pullRequest.getApproveCnt())
                .state(pullRequest.getState().toString())
                .merged(pullRequest.getMerged())
                .mergeable(pullRequest.getMergeable())
                .head(pullRequest.getHead())
                .base(pullRequest.getBase())
                .commitCnt(pullRequest.getCommitCnt())
                .changedFilesCnt(pullRequest.getChangedFilesCnt())
                .commentCnt(pullRequest.getCommentCnt())
                .reviewCommentCnt(pullRequest.getReviewCommentCnt())
                .githubCreatedAt(pullRequest.getGithubCreatedAt())
                .githubUpdatedAt(pullRequest.getGithubUpdatedAt())
                .repo(RepoResponse.fromEntity(pullRequest.getRepo()))
                .author(PrUserInfo.fromEntity(pullRequest.getAuthor()))
                .build();
    }

    public static PullRequestResponse fromEntityAndIsApproved(PullRequest pullRequest, Boolean isApproved) {
        return PullRequestResponse.builder()
                .id(pullRequest.getId())
                .githubPrNumber(pullRequest.getGithubPrNumber())
                .githubId(pullRequest.getGithubId())
                .title(pullRequest.getTitle())
                .body(pullRequest.getBody())
                .summary(pullRequest.getSummary())
                .approveCnt(pullRequest.getApproveCnt())
                .state(pullRequest.getState().toString())
                .merged(pullRequest.getMerged())
                .mergeable(pullRequest.getMergeable())
                .isApproved(isApproved)
                .head(pullRequest.getHead())
                .base(pullRequest.getBase())
                .commitCnt(pullRequest.getCommitCnt())
                .changedFilesCnt(pullRequest.getChangedFilesCnt())
                .commentCnt(pullRequest.getCommentCnt())
                .reviewCommentCnt(pullRequest.getReviewCommentCnt())
                .githubCreatedAt(pullRequest.getGithubCreatedAt())
                .githubUpdatedAt(pullRequest.getGithubUpdatedAt())
                .repo(RepoResponse.fromEntity(pullRequest.getRepo()))
                .author(PrUserInfo.fromEntity(pullRequest.getAuthor()))
                .build();
    }
}
