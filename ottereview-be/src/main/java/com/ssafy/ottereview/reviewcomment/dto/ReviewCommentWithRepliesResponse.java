package com.ssafy.ottereview.reviewcomment.dto;

import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Builder(toBuilder = true)
@Getter
public class ReviewCommentWithRepliesResponse {

    private Long id;

    private Long userId;

    private String userName;

    /** 리뷰 ID */
    private Long reviewId;

    /** 코멘트가 달린 파일 경로 */
    private String path;

    /** 코멘트 본문 */
    private String body;

    /** 내부 레코드 키 */
    private String recordKey;

    /** position (diff 상 위치) */
    private Integer position;

    /** 라인 번호 */
    private Integer line;

    /** side ("LEFT" or "RIGHT") */
    private String side;

    /** 멀티 라인 코멘트 시작 라인 */
    private Integer startLine;

    /** 멀티 라인 코멘트 시작 side */
    private String startSide;

    /** diff 코드 스니펫 */
    private String diffHunk;

    /** 코멘트가 속한 commit SHA */
    private String commitId;

    /** GitHub 코멘트 생성 시간 */
    private LocalDateTime githubCreatedAt;

    /** GitHub 코멘트 수정 시간 */
    private LocalDateTime githubUpdatedAt;

    /** 서버 DB 생성 시간 */
    private LocalDateTime createdAt;

    /** 서버 DB 수정 시간 */
    private LocalDateTime modifiedAt;

    /** 음성 파일 URL (recordKey가 있을 때만) */
    private String voiceFileUrl;

    /** 부모 댓글 ID (답글인 경우) */
    private Long parentCommentId;

    /** GitHub 답글 대상 ID */
    private Long githubInReplyToId;

    /** 답글 목록 */
    private List<ReviewCommentWithRepliesResponse> replies;

    public static ReviewCommentWithRepliesResponse from(ReviewComment comment) {
        return ReviewCommentWithRepliesResponse.builder()
                .id(comment.getId())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getGithubUsername())
                .reviewId(comment.getReview().getId())
                .path(comment.getPath())
                .body(comment.getBody())
                .recordKey(comment.getRecordKey())
                .position(comment.getPosition())
                .line(comment.getLine())
                .side(comment.getSide())
                .startLine(comment.getStartLine())
                .startSide(comment.getStartSide())
                .diffHunk(comment.getDiffHunk())
                .commitId(comment.getReview().getCommitSha())
                .githubCreatedAt(comment.getGithubCreatedAt())
                .githubUpdatedAt(comment.getGithubUpdatedAt())
                .createdAt(comment.getCreatedAt())
                .modifiedAt(comment.getModifiedAt())
                .voiceFileUrl(null) // 서비스에서 별도 설정
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .githubInReplyToId(comment.getGithubInReplyToId())
                .build();
    }
}