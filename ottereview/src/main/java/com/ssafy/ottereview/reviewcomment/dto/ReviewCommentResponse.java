package com.ssafy.ottereview.reviewcomment.dto;
import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class ReviewCommentResponse {
    private Long id;
    private Long pullRequestId;
    private Long authorId;
    private String authorName;
    private String commitSha;
    private String filePath;
    private Integer lineNumber;
    private String content;
    private String recordKey;

    public static ReviewCommentResponse from(ReviewComment comment) {
        return ReviewCommentResponse.builder()
                .id(comment.getId())
                .pullRequestId(comment.getPullRequest().getId())
                .authorId(comment.getAuthor().getId())
                .authorName(comment.getAuthor().getGithubUsername())
                .commitSha(comment.getCommitSha())
                .filePath(comment.getFilePath())
                .lineNumber(comment.getLineNumber())
                .content(comment.getContent())
                .recordKey(comment.getRecord_key())
                .build();
    }
}