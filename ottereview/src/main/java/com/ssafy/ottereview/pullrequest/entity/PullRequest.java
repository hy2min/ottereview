package com.ssafy.ottereview.pullrequest.entity;

import com.ssafy.ottereview.common.entity.BaseEntity;
import com.ssafy.ottereview.githubapp.dto.GithubPrResponse;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
@Entity
@Table(name = "pull_request")
public class PullRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User author;

    @Column(unique = true)
    private Long githubPrId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repo_id")
    private Repo repo;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false)
    private String headBranch;

    @Column(nullable = false)
    private String baseBranch;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private Integer approveCount;

    @Column(nullable = false)
    private boolean mergeable;

    @Column
    private String authorLogin;

    @Column
    private String htmlUrl;

    @Column
    private Integer commitCnt;

    @Column
    private Integer additionCnt; // 추가된 라인 수

    @Column
    private Integer deletionCnt; // 삭제된 라인 수

    @Column
    private Integer changedFilesCnt; // 변경된 파일 수

    @Column
    private Integer commentCnt; // 일반 코멘트 수

    @Column
    private Integer reviewCommentCnt; // 리뷰 코멘트 수

    @Column
    private LocalDateTime githubCreatedAt; // GitHub에서의 생성일시

    @Column
    private LocalDateTime githubUpdatedAt; // GitHub에서의 수정일시

    @Column
    private String patchUrl; // Patch 파일 URL

    @Column
    private String diffUrl; // Diff 파일 URL

    @Column
    private LocalDateTime mergedAt; // 머지 일시

    @Column
    private String mergeCommitSha; // 머지 커밋 SHA

    public void enrollRepo(Repo repo) {
        this.repo = repo;
    }

    public void enrollAuthor(User author) {
        this.author = author;
    }

    public boolean hasChangedFrom(GithubPrResponse githubPr) {
        return !Objects.equals(this.title, githubPr.getTitle()) ||
                !Objects.equals(this.status, githubPr.getStatus()
                        .toUpperCase()) ||
                !Objects.equals(this.description, githubPr.getDescription()) ||
                !Objects.equals(this.baseBranch, githubPr.getBaseBranch() != null ? githubPr.getBaseBranch() : null) ||
                !Objects.equals(this.headBranch, githubPr.getHeadBranch() != null ? githubPr.getHeadBranch() : null) ||
                !Objects.equals(this.githubUpdatedAt, githubPr.getUpdatedAt()) ||
                !Objects.equals(this.commitCnt, githubPr.getCommitCnt()) ||
                !Objects.equals(this.additionCnt, githubPr.getAdditionCnt()) ||
                !Objects.equals(this.deletionCnt, githubPr.getDeletionCnt()) ||
                !Objects.equals(this.changedFilesCnt, githubPr.getChangedFilesCnt());
    }

    public void updateFromGithub(GithubPrResponse githubPr) {
        this.title = githubPr.getTitle();
        this.status = githubPr.getStatus()
                .toUpperCase();
        this.description = githubPr.getDescription();
        this.baseBranch = githubPr.getBaseBranch() != null ? githubPr.getBaseBranch() : null;
        this.headBranch = githubPr.getHeadBranch() != null ? githubPr.getHeadBranch() : null;
        this.githubUpdatedAt = githubPr.getUpdatedAt();
        this.mergeable = githubPr.getMergeable() != null ? githubPr.getMergeable() : false;

        // 통계 정보 업데이트
        this.commitCnt = githubPr.getCommitCnt();
        this.additionCnt = githubPr.getAdditionCnt();
        this.deletionCnt = githubPr.getDeletionCnt();
        this.changedFilesCnt = githubPr.getChangedFilesCnt();
        this.commentCnt = githubPr.getCommentCnt();
        this.reviewCommentCnt = githubPr.getReviewCommentCnt();

        // URL 정보 업데이트
        this.htmlUrl = githubPr.getHtmlUrl();
    }
}
