package com.ssafy.ottereview.repo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Entity
@Builder
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

    @Column(name = "installation_id")
    private Long installationId;

    @Column(name = "is_cushion", nullable = false)
    private boolean isCushion;

    @Column(name = "is_private", nullable = false)
    private boolean isPrivate;

    public Long getId() {
        return id;
    }

    public String getGithubRepoName() {
        return githubRepoName;
    }

    public String getGithubOwnerUsername() {
        return githubOwnerUsername;
    }

    public Long getInstallationId() {
        return installationId;
    }

    public boolean isCushion() {
        return isCushion;
    }

    public boolean isPrivate() {
        return isPrivate;
    }

    public void enrollInstallationId(Long installationId) {
        this.installationId = installationId;
    }
    public void cushionToggle(boolean isCushion){
        this.isCushion = isCushion;
    }
    public void changeOpenType(boolean isPrivate){
        this.isPrivate = isPrivate;
    }


}
