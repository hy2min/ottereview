package com.ssafy.ottereview.pullrequest.dto;

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
public class PreparePullRequestResponse {
    
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
}
