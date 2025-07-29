package com.ssafy.ottereview.pullrequest.dto.request;

import com.ssafy.ottereview.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class PullRequestCreateRequest {

    private Long githubPrId;
    private Long repoId;
    private User author;
    private String title;
    private String description;
    private String summary;
    private String headBranch;
    private String baseBranch;
    private String status;
    private int approveCount;
    private boolean mergeable;

}