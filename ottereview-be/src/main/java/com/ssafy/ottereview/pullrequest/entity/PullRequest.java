package com.ssafy.ottereview.pullrequest.entity;

import com.ssafy.ottereview.common.entity.BaseEntity;
import com.ssafy.ottereview.githubapp.dto.GithubPrResponse;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.webhook.dto.PullRequestEventDto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

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

    @Column
    private Integer githubPrNumber;

    @Column
    private Long githubId;
    
    @Column
    private String commitSha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repo_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Repo repo;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrState state;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User author;

    @Column(nullable = false)
    private Boolean merged;

    @Column(nullable = false)
    private String base;

    @Column(nullable = false)
    private String head;

    @Column(nullable = false)
    private Boolean mergeable;

    @Column
    private LocalDateTime githubCreatedAt; // GitHub에서의 생성일시

    @Column
    private LocalDateTime githubUpdatedAt; // GitHub에서의 수정일시

    @Column
    private Integer commitCnt;

    @Column
    private Integer changedFilesCnt; // 변경된 파일 수

    @Column
    private Integer commentCnt; // 일반 코멘트 수

    @Column
    private Integer reviewCommentCnt; // 리뷰 코멘트 수

    @Column
    private URL htmlUrl;

    @Column
    private URL patchUrl; // Patch 파일 URL

    @Column
    private URL issueUrl; // Issue URL

    @Column
    private URL diffUrl; // Diff 파일 URL

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false)
    private Integer approveCnt; // 현재 승인 수

    public void changeMergeable(boolean mergeable){
        this.mergeable = mergeable;
    }

    public void enrollRepo(Repo repo) {
        this.repo = repo;
    }

    public void enrollAuthor(User author) {
        this.author = author;
    }

    public void enrollSummary(String summary) {
        this.summary = summary;
    }

    public boolean hasChangedFrom(GithubPrResponse githubPr) {
        return !Objects.equals(this.githubPrNumber, githubPr.getGithubPrNumber()) ||
                !Objects.equals(this.githubId, githubPr.getGithubId()) ||
                !Objects.equals(this.commitSha, githubPr.getCommitSha()) ||
                !Objects.equals(this.title, githubPr.getTitle()) ||
                !Objects.equals(this.state, githubPr.getState()) ||
                !Objects.equals(this.body, githubPr.getBody()) ||
                !Objects.equals(this.merged, githubPr.getMerged()) ||
                !Objects.equals(this.base, githubPr.getBase()) ||
                !Objects.equals(this.head, githubPr.getHead()) ||
                !Objects.equals(this.mergeable, githubPr.getMergeable()) ||
                !Objects.equals(this.githubCreatedAt, githubPr.getGithubCreatedAt()) ||
                !Objects.equals(this.githubUpdatedAt, githubPr.getGithubUpdatedAt()) ||
                !Objects.equals(this.commitCnt, githubPr.getCommitCnt()) ||
                !Objects.equals(this.changedFilesCnt, githubPr.getChangedFilesCnt()) ||
                !Objects.equals(this.commentCnt, githubPr.getCommentCnt()) ||
                !Objects.equals(this.reviewCommentCnt, githubPr.getReviewCommentCnt()) ||
                !Objects.equals(this.htmlUrl, githubPr.getHtmlUrl()) ||
                !Objects.equals(this.patchUrl, githubPr.getPatchUrl()) ||
                !Objects.equals(this.issueUrl, githubPr.getIssueUrl()) ||
                !Objects.equals(this.diffUrl, githubPr.getDiffUrl());
    }

    public void updateFromGithub(GithubPrResponse githubPr) {
        // 기본 PR 정보 업데이트
        this.commitSha = githubPr.getCommitSha();
        this.githubPrNumber = githubPr.getGithubPrNumber();
        this.title = githubPr.getTitle();
        this.state = PrState.fromGithubState(githubPr.getState(), githubPr.getMerged());
        this.body = githubPr.getBody();
        this.merged = githubPr.getMerged();
        this.base = githubPr.getBase();
        this.head = githubPr.getHead();
        this.mergeable = githubPr.getMergeable() != null && githubPr.getMergeable();

        // GitHub 시간 정보 업데이트
        this.githubCreatedAt = githubPr.getGithubCreatedAt();
        this.githubUpdatedAt = githubPr.getGithubUpdatedAt();

        // 통계 정보 업데이트
        this.commitCnt = githubPr.getCommitCnt();
        this.changedFilesCnt = githubPr.getChangedFilesCnt();
        this.commentCnt = githubPr.getCommentCnt();
        this.reviewCommentCnt = githubPr.getReviewCommentCnt();

        // URL 정보 업데이트
        this.htmlUrl = githubPr.getHtmlUrl();
        this.patchUrl = githubPr.getPatchUrl();
        this.issueUrl = githubPr.getIssueUrl();
        this.diffUrl = githubPr.getDiffUrl();
    }

    public void updateState(PrState state){
        this.state = state;
    }
    
    public void synchronizedByWebhook(PullRequestEventDto event){
        this.commitSha = event.getPullRequest().getHead().getSha();
        this.title = event.getPullRequest().getTitle();
        this.body = event.getPullRequest().getBody();
        this.state = PrState.fromGithubState(event.getPullRequest().getState(), event.getPullRequest().getMerged());
        this.merged = event.getPullRequest().getMerged() != null && event.getPullRequest().getMerged();
        this.githubUpdatedAt = event.getPullRequest().getUpdatedAt();
        this.commitCnt = event.getPullRequest().getCommits();
        this.changedFilesCnt = event.getPullRequest().getChangedFiles();
        this.commentCnt = event.getPullRequest().getComments();
        this.reviewCommentCnt = event.getPullRequest().getReviewComments();
        this.htmlUrl = event.getPullRequest().getHtmlUrl();
        this.patchUrl = event.getPullRequest().getPatchUrl();
        this.issueUrl = event.getPullRequest().getIssueUrl();
        this.diffUrl = event.getPullRequest().getDiffUrl();
        if(event.getPullRequest().getMergeable() != null) {
            this.mergeable = event.getPullRequest().getMergeable();
        }
        this.base = event.getPullRequest().getBase().getRef();
    }
    
    public void addApproveCnt() {
        this.approveCnt++;
    }

    public static PullRequest to(PullRequestResponse event){
        Repo repoEntity = null;
        if (event.getRepo() != null) {
            repoEntity = Repo.builder()
                    .id(event.getRepo().getId())
                    .build();
        }

        User authorEntity = null;
        if (event.getAuthor() != null) {
            authorEntity = User.builder()
                    .id(event.getAuthor().getId())
                    .build();
        }

        return PullRequest.builder()
                .id(event.getId())
                .githubPrNumber(event.getGithubPrNumber())
                .githubId(event.getGithubId())
                .title(event.getTitle())
                .body(event.getBody())
                .summary(event.getSummary())
                .approveCnt(event.getApproveCnt())
                .state(PrState.valueOf(event.getState())) // enum 변환
                .merged(event.getMerged())
                .mergeable(event.getMergeable())
                .head(event.getHead())
                .base(event.getBase())
                .commitCnt(event.getCommitCnt())
                .changedFilesCnt(event.getChangedFilesCnt())
                .commentCnt(event.getCommentCnt())
                .reviewCommentCnt(event.getReviewCommentCnt())
                .githubCreatedAt(event.getGithubCreatedAt())
                .githubUpdatedAt(event.getGithubUpdatedAt())
                .repo(repoEntity)
                .author(authorEntity)
                .build();
    }

}
