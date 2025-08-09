package com.ssafy.ottereview.description.entity;

import com.ssafy.ottereview.common.entity.BaseEntity;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
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
@Builder
@Table(name = "description")
public class Description extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "pull_request_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private PullRequest pullRequest;

    @ManyToOne(fetch = jakarta.persistence.FetchType.LAZY,
            cascade = CascadeType.PERSIST)
    private User user;

    @Column(nullable = false)
    private String path;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "record_key")
    private String recordKey;

    @Column(name = "start_line")
    private Integer startLine;

    @Column(name = "start_side")
    private String startSide;

    @Column
    private Integer line;

    @Column
    private String side;

    @Column
    private Integer position;

    @Column(name = "diff_hunk", columnDefinition = "TEXT")
    private String diffHunk;

    public void updateBodyAndRecordKey(String body, String recordKey) {
        this.body = body;
        this.recordKey = recordKey;
    }
}
