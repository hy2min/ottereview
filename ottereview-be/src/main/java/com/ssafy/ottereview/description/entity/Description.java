package com.ssafy.ottereview.description.entity;

import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class Description {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String path;

    @Column
    private String body;

    @Column
    private String recordKey;

    @Column
    private String position;

    @ManyToOne
    @JoinColumn(name = "pr_id")
    private PullRequest pullRequest;

    @Column(name = "start_line")
    private Integer startLine;

    @Column(name = "start_side")
    private String startSide;

    @Column
    private Integer line;

    @Column
    private String side;

    @Column(name = "diff_hunk", columnDefinition = "TEXT")
    private String diffHunk;

}
