package com.ssafy.ottereview.pullrequest.dto.response;

import com.ssafy.ottereview.branch.entity.Branch;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestCommitInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestDescriptionInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestFileInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestPriorityInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestReviewInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestReviewerInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestUserInfo;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class PullRequestDetailResponse {

    private Long id;
    private Long githubId;
    private Integer githubPrNumber;
    private String title;
    private String body;
    private String state;
    private Boolean merged;
    private String base;
    private Branch baseBranch;
    private String head;
    private Branch headBranch;
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
    private RepoResponse repo;
    private PullRequestUserInfo author;
    private List<PullRequestReviewerInfo> reviewers;
    private List<PullRequestFileInfo> files;
    private List<PullRequestCommitInfo> commits;
    private List<PullRequestDescriptionInfo> descriptions;
    private List<PullRequestReviewInfo> reviews;
    private List<PullRequestPriorityInfo> priorities;

    public void enrollReview(List<PullRequestReviewInfo> review) {
        this.reviews = review;
    }

    public void enrollDescription(List<PullRequestDescriptionInfo> descriptions) {
        this.descriptions = descriptions;
    }

    public void enrollReviewers(List<PullRequestReviewerInfo> reviewers) {
        this.reviewers = reviewers;
    }
    
    public void enrollPriorities(List<PullRequestPriorityInfo> priorities) {
        this.priorities = priorities;
    }
}
