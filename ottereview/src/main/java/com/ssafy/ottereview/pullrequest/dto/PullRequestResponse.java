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

    // 식별자
    private Long id;
    private Integer githubPrNumber;

    // Pull Request 관련 정보
    private String title;
    private String body;
    private String summary;
    private Integer approveCnt;
    private String state;
    private Boolean merged;
    private Boolean mergeable;

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
    private UserResponseDto author;
}
