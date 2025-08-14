package com.ssafy.ottereview.pullrequest.dto.info;

import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PullRequestReviewCommentInfo {

    private Long id;
    private String path;
    private String body;
    private String recordKey;
    private Integer position;
    private Integer line;
    private String side;
    private Integer startLine;
    private String startSide;
    private String diffHunk;
    private String commitId;
    private LocalDateTime githubCreatedAt;
    private LocalDateTime githubUpdatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private String voiceFileUrl;
    private Long parentCommentId;

    public static PullRequestReviewCommentInfo fromEntity(ReviewComment reviewComment, String voiceFileUrl) {
        return PullRequestReviewCommentInfo.builder()
                .id(reviewComment.getId())
                .path(reviewComment.getPath())
                .body(reviewComment.getBody())
                .recordKey(reviewComment.getRecordKey())
                .position(reviewComment.getPosition())
                .line(reviewComment.getLine())
                .side(reviewComment.getSide())
                .startLine(reviewComment.getStartLine())
                .startSide(reviewComment.getStartSide())
                .diffHunk(reviewComment.getDiffHunk())
                .commitId(reviewComment.getReview().getCommitSha())
                .githubCreatedAt(reviewComment.getGithubCreatedAt())
                .githubUpdatedAt(reviewComment.getGithubUpdatedAt())
                .createdAt(reviewComment.getCreatedAt())
                .modifiedAt(reviewComment.getModifiedAt())
                .voiceFileUrl(voiceFileUrl)
                .parentCommentId(reviewComment.getParentComment() != null ? reviewComment.getParentComment().getId() : null)
                .build();
    }
}
