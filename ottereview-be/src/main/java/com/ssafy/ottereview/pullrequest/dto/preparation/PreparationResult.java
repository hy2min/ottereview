package com.ssafy.ottereview.pullrequest.dto.preparation;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.kohsuke.github.GHCompare.Status;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PreparationResult {

    private String source;
    private String target;
    private String url;
    private String htmlUrl;
    private String permalinkUrl;
    private String diffUrl;
    private String patchUrl;
    private Status status;
    private int aheadBy;
    private int behindBy;
    private int totalCommits;
    private CommitInfo baseCommit;
    private CommitInfo mergeBaseCommit;
    private List<CommitInfo> commits;
    private List<FileChangeInfo> files;
    private String summary;
    private List<UserInfo> reviewers;
    private List<DescriptionInfo> descriptions;
    private List<PriorityInfo> priorities;
    private UserInfo author;
    private RepoInfo repository;
    private String title;
    private String body;

    public void enrollSummary(String summary) {
        this.summary = summary;
    }

    public void enrollReviewers(List<UserInfo> reviewer) {
        this.reviewers = reviewer;
    }

    public void enrollDescriptions(List<DescriptionInfo> description) {
        this.descriptions = description;
    }

    public void enrollPriorities(List<PriorityInfo> priorities) {
        this.priorities = priorities;
    }

    public void enrollTitle(String title) {
        this.title = title;
    }

    public void enrollBody(String body) {
        this.body = body;
    }
}
