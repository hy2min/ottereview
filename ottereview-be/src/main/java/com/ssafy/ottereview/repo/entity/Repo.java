package com.ssafy.ottereview.repo.entity;

import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.common.entity.BaseEntity;
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

@Entity
@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "Repository")
public class Repo extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "repo_id", nullable = false, unique = true)
    private Long repoId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "is_cushion", nullable = false)
    private boolean isCushion;

    @Column(name = "is_private", nullable = false)
    private boolean isPrivate;

    @ManyToOne
    @JoinColumn(name = "account_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Account account;

    public Repo(Long repoId, String fullName, Account account, boolean isCushion,
            boolean isPrivate) {
        this.repoId = repoId;
        this.fullName = fullName;
        this.account = account;
        this.isCushion = isCushion;
        this.isPrivate = isPrivate;
    }

    public void enrollAccount(Account account) {
        this.account = account;
    }

    public void cushionToggle(boolean isCushion) {
        this.isCushion = isCushion;
    }

    public void changeOpenType(boolean isPrivate) {
        this.isPrivate = isPrivate;
    }
}
