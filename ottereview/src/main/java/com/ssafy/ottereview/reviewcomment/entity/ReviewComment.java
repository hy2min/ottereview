package com.ssafy.ottereview.reviewcomment.entity;

import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
public class ReviewComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    private PullRequest pullRequest;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    private User author;

    @Column
    private String commitSha;

    @Column
    String filePath;

    @Column
    Integer lineNumber;

    @Column
    String content;

    @Column(nullable = true)
    String record_key;
}
