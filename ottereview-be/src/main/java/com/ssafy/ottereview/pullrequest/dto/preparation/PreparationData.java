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
public class PreparationData {
    
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
    private List<ReviewerInfo> reviewers;
    private List<ReviewInfo> reviews;
    private List<DescriptionInfo> descriptions;
    
    public void enrollSummary(String summary) {
        this.summary = summary;
    }
    
    public void enrollReviewers(List<ReviewerInfo> reviewer) {
        this.reviewers = reviewer;
    }
    
    public void enrollReviews(List<ReviewInfo> review) {
        this.reviews = review;
    }
    
    public void enrollDescriptions(List<DescriptionInfo> description) {
        this.descriptions = description;
    }
}
