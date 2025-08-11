package com.ssafy.ottereview.merge.dto;

import com.ssafy.ottereview.pullrequest.dto.info.PullRequestCommitInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestFileInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestPriorityInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestReviewerInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestUserInfo;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestDetailResponse;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MergedPullRequestInfo {
    
    private Long id;
    private Long githubId;
    private Integer githubPrNumber;
    private String title;
    private String body;
    private String state;
    private Boolean merged;
    private String base;
    private String head;
    private Boolean mergeable;
    private LocalDateTime githubCreatedAt;
    private LocalDateTime githubUpdatedAt;
    private Integer commitCnt;
    private Integer changedFilesCnt;
    private Integer commentCnt;
    private Integer reviewCommentCnt;
    private URL htmlUrl;
    private URL patchUrl;
    private URL issueUrl;
    private URL diffUrl;
    private String summary;
    private Integer approveCnt;
    
    // 객체 타입
    private PullRequestUserInfo author;
    private RepoResponse repo;
    private List<PullRequestFileInfo> files;
    private List<PullRequestCommitInfo> commits;
    private List<PullRequestReviewerInfo> reviewers;
    private List<PullRequestPriorityInfo> priorities;
    
    public static MergedPullRequestInfo from(PullRequestDetailResponse response,
            List<PullRequestReviewerInfo> reviewers,
            List<PullRequestPriorityInfo> priorities) {
        return MergedPullRequestInfo.builder()
                .id(response.getId())
                .githubId(response.getGithubId())
                .githubPrNumber(response.getGithubPrNumber())
                .title(response.getTitle())
                .body(response.getBody())
                .state(response.getState())
                .merged(response.getMerged())
                .base(response.getBase())
                .head(response.getHead())
                .mergeable(response.getMergeable())
                .githubCreatedAt(response.getGithubCreatedAt())
                .githubUpdatedAt(response.getGithubUpdatedAt())
                .commitCnt(response.getCommitCnt())
                .changedFilesCnt(response.getChangedFilesCnt())
                .commentCnt(response.getCommentCnt())
                .reviewCommentCnt(response.getReviewCommentCnt())
                .htmlUrl(response.getHtmlUrl())
                .patchUrl(response.getPatchUrl())
                .issueUrl(response.getIssueUrl())
                .diffUrl(response.getDiffUrl())
                .summary(response.getSummary())
                .approveCnt(response.getApproveCnt())
                .author(response.getAuthor())
                .repo(response.getRepo())
                .files(response.getFiles())
                .commits(response.getCommits())
                .reviewers(reviewers)
                .priorities(priorities)
                .build();
    }
}
