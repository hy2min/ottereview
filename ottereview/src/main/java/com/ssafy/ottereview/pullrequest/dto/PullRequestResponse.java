package com.ssafy.ottereview.pullrequest.dto;

import com.ssafy.ottereview.repo.dto.RepoResponse;
import com.ssafy.ottereview.user.dto.UserResponseDto;
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

    private Long id;
    private Long githubPrId;
    private String title;
    private String description;
    private String summary;
    private String headBranch;
    private String baseBranch;
    private String status;
    private Integer approveCount;
    private boolean mergeable;
    private String authorLogin;
    private String htmlUrl;
    private Integer commitCnt;
    private Integer additionCnt;
    private Integer deletionCnt;
    private Integer changedFilesCnt;
    private Integer commentCnt;
    private Integer reviewCommentCnt;
    private LocalDateTime githubCreatedAt;
    private LocalDateTime githubUpdatedAt;
    private String patchUrl;
    private String diffUrl;
    private LocalDateTime mergedAt;
    private String mergeCommitSha;
    private RepoResponse repo;
    private UserResponseDto author;
    private LocalDateTime createdAt;

}
