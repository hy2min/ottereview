package com.ssafy.ottereview.pullrequest.dto.response;

import com.ssafy.ottereview.pullrequest.dto.detail.PullRequestCommitDetail;
import com.ssafy.ottereview.pullrequest.dto.detail.PullRequestFileDetail;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import com.ssafy.ottereview.user.dto.UserResponseDto;
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
    private Integer githubPrNumber;
    private String title;
    private String body;
    private String state;
    private Boolean merged;
    private String base;
    private String head;
    private boolean mergeable;
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
    private UserResponseDto author;
    private RepoResponse repo;
    private List<PullRequestFileDetail> files;
    private List<PullRequestCommitDetail> commits;

}
