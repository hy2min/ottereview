package com.ssafy.ottereview.reviewcomment.entity;

import com.ssafy.ottereview.common.entity.BaseEntity;
import com.ssafy.ottereview.review.entity.Review;
import com.ssafy.ottereview.user.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Entity
@Builder(toBuilder = true)
@Table(name = "review_comment")
public class ReviewComment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "github_id", unique = true)
    private Long githubId;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY,
            cascade = CascadeType.PERSIST)
    private User user;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "review_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Review review;

    @Column(nullable = false)
    private String path;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "record_key")
    private String recordKey;

    /**
     * GitHub start_line (멀티 라인 코멘트 시작점)
     */
    @Column(name = "start_line")
    private Integer startLine;

    /**
     * GitHub start_side
     */
    @Column(name = "start_side")
    private String startSide;

    /**
     * GitHub line: 실제 라인 번호
     */
    @Column
    private Integer line;

    /**
     * GitHub side: 'LEFT' or 'RIGHT'
     */
    @Column
    private String side;

    /**
     * GitHub의 position (diff 상에서의 라인 위치)
     */
    @Column
    private Integer position;

    /**
     * GitHub diff_hunk: diff 코드 스니펫
     */
    @Column(name = "diff_hunk", columnDefinition = "TEXT")
    private String diffHunk;

    @Column(name = "github_created_at")
    private LocalDateTime githubCreatedAt;

    @Column(name = "github_updated_at")
    private LocalDateTime githubUpdatedAt;

    /**
     * 답글의 부모 댓글 ID (null이면 최상위 댓글)
     */
    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private ReviewComment parentComment;

    /**
     * GitHub in_reply_to ID (GitHub 답글 시 사용)
     */
    @Column(name = "github_in_reply_to_id")
    private Long githubInReplyToId;

    public void updateBodyAndTime(String body, LocalDateTime createAt, LocalDateTime updatedAt) {
        this.body = body;
        this.githubCreatedAt = createAt;
        this.githubUpdatedAt = updatedAt;
    }
}
