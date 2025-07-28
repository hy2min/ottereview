package com.ssafy.ottereview.githubapp.dto;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.kohsuke.github.GHPullRequest;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class GithubPrResponse {

    private Long githubPrId;
    private Long repoId;
    private String title;
    private String description;
    private String headBranch;
    private String baseBranch;
    private String status;
    private Boolean mergeable;
    private String authorLogin;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String htmlUrl;
    private Integer commitCnt;
    private Integer additionCnt;
    private Integer deletionCnt;
    private Integer changedFilesCnt;
    private Integer commentCnt;
    private Integer reviewCommentCnt;


    public static GithubPrResponse from(GHPullRequest pr) {
        try {
            return new GithubPrResponse(
                    pr.getId(),                              // githubPrId
                    pr.getRepository()
                            .getId(),              // repoId
                    pr.getTitle(),                           // title
                    pr.getBody(),                            // description
                    pr.getHead()
                            .getRef(),                   // headBranch
                    pr.getBase()
                            .getRef(),                   // baseBranch
                    pr.getState()
                            .name(),                    // status
                    pr.getMergeable(),                       // mergeable
                    pr.getUser()
                            .getLogin(),                 // authorLogin
                    convertToLocalDateTime(pr.getCreatedAt()), // createdAt
                    convertToLocalDateTime(pr.getUpdatedAt()), // updatedAt
                    pr.getHtmlUrl()
                            .toString(),              // htmlUrl
                    pr.getCommits(),                         // commitCnt
                    pr.getAdditions(),                       // additionCnt
                    pr.getDeletions(),                       // deletionCnt
                    pr.getChangedFiles(),                    // changedFilesCnt
                    pr.getComments()
                            .size(),                        // commentCnt ← 추가
                    pr.getReviewComments()                   // reviewCommentCnt ← 추가
            );
        } catch (IOException e) {
            throw new RuntimeException("Failed to convert GHPullRequest to DTO", e);
        }
    }

    // 날짜 변환 유틸리티 메서드
    private static LocalDateTime convertToLocalDateTime(Object dateObj) {
        if (dateObj == null) {
            return null;
        }
        try {
            // GitHub API는 java.util.Date를 반환
            if (dateObj instanceof java.util.Date) {
                java.util.Date date = (java.util.Date) dateObj;
                return date.toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime();
            }

            // 만약 다른 타입이라면 toString()으로 파싱 시도
            String dateStr = dateObj.toString();
            return LocalDateTime.parse(dateStr.replace("Z", ""));

        } catch (Exception e) {
            // 변환 실패시 현재 시간 반환
            return LocalDateTime.now();
        }
    }
}
