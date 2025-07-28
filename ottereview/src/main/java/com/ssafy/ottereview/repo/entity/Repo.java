package com.ssafy.ottereview.repo.entity;

import com.ssafy.ottereview.account.entity.Account;
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

@Entity
@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "Repository")
public class Repo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;
    
    @Column(name = "github_repo_name", nullable = false)
    private String githubRepoName;
    
    @Column(name = "github_owner_username", nullable = false)
    private String githubOwnerUsername;
    
    @Column(name = "is_cushion", nullable = false)
    private boolean isCushion;
    
    @Column(name = "is_private", nullable = false)
    private boolean isPrivate;
    
    @ManyToOne
    @JoinColumn(name="account_id")
    private Account account;
    
    public Repo(String githubRepoName, String githubOwnerUsername, Account account, boolean isCushion, boolean isPrivate) {
        this.githubRepoName = githubRepoName;
        this.githubOwnerUsername = githubOwnerUsername;
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
