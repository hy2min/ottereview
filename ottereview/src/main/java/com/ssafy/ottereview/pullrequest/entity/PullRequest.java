package com.ssafy.ottereview.pullrequest.entity;

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
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "pull_request")
public class PullRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User author;

    @Column(unique = true)
    private Long githubPrId;

    @Column
    private Long repoId;

    @Column(nullable = false)
    private String title;

    @Column
    private String description;

    @Column(nullable = false)
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

}
