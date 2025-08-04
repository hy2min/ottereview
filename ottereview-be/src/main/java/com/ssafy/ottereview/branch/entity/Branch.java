package com.ssafy.ottereview.branch.entity;

import com.ssafy.ottereview.repo.entity.Repo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name="branch")
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "min_approve_cnt")
    private int minApproveCnt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repo_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Repo repo;

    public Branch(String name , int minApproveCnt, Repo repo){
        this.name = name;
        this.minApproveCnt = minApproveCnt;
        this.repo = repo;
    }

    public void settingMinApproveCnt(int minApproveCnt){
        this.minApproveCnt = minApproveCnt;
    }
}

