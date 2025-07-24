package com.ssafy.ottereview.repo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "Repository")
public class Repo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "repo_id", nullable = false, columnDefinition = "BigInt")
    private long repoId;

    @Column(name = "github_repo_name", nullable = false, columnDefinition = "varchar(50)")
    private String githubRepoName;

    @Column(name = "github_owner_username", nullable = false, columnDefinition = "varchar(50)")
    private String githubOwnerUsername;

    @Column(name = "installation_id", columnDefinition = "int")
    private String installationId;

    @Column(name = "is_cushion", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean isCushion;

    @Column(name = "is_private", nullable = false, columnDefinition = "Boolean default false")
    private boolean isPrivate;

    public long getRepoId() {
        return repoId;
    }

    public String getGithubRepoName() {
        return githubRepoName;
    }

    public String getGithubOwnerUsername() {
        return githubOwnerUsername;
    }

    public String getInstallationId() {
        return installationId;
    }

    public boolean isCushion() {
        return isCushion;
    }

    public boolean isPrivate() {
        return isPrivate;
    }

}
