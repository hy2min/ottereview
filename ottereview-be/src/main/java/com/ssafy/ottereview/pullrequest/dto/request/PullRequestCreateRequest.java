package com.ssafy.ottereview.pullrequest.dto.request;

import com.ssafy.ottereview.pullrequest.dto.preparation.CommitInfo;
import com.ssafy.ottereview.pullrequest.dto.preparation.DescriptionInfo;
import com.ssafy.ottereview.pullrequest.dto.preparation.FileChangeInfo;
import com.ssafy.ottereview.pullrequest.dto.preparation.PriorityInfo;
import com.ssafy.ottereview.pullrequest.dto.preparation.RepoInfo;
import com.ssafy.ottereview.pullrequest.dto.preparation.UserInfo;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.kohsuke.github.GHCompare.Status;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class PullRequestCreateRequest {
    
    private String source;
    private String target;
    private String url;
    private String htmlUrl;
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
    
}
