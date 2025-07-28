package com.ssafy.ottereview.comment.entity;

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

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Entity
public class Comment {

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

    @Column
    String record_key;

}
