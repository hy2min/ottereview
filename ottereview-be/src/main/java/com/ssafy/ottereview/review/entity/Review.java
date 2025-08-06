package com.ssafy.ottereview.review.entity;

import com.ssafy.ottereview.common.entity.BaseEntity;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
import com.ssafy.ottereview.user.entity.User;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Builder
@Table(name = "review")
public class Review extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "github_id")
    private Long githubId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pull_request_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private PullRequest pullRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReviewState state;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "commit_sha")
    private String commitSha;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ReviewComment> reviewComments = new ArrayList<>();

    @Column(name = "github_created_at")
    private LocalDateTime githubCreatedAt;

    public void addReviewComment(ReviewComment reviewComment) {
        this.reviewComments.add(reviewComment);
    }

    public void addReviewComments(List<ReviewComment> reviewComments) {
        this.reviewComments.addAll(reviewComments);
    }

    public void updateGithubId(Long githubId) {
        this.githubId = githubId;
    }
}
