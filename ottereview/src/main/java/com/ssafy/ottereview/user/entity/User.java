package com.ssafy.ottereview.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id", nullable=false)
    private Long id;

    @Column(name = "github_username", nullable = false)
    private String githubUsername;

    @Column(name = "github_email", nullable = false)
    private String githubEmail;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "access_token")
    private String accessToken;

    @Column(name = "reward_points")
    private int rewardPoints;

    @Column(name = "user_grade")
    private String userGrade;

    public Long getId() {
        return id;
    }

    public String getGithubUsername() {
        return githubUsername;
    }

    public String getGithubEmail() {
        return githubEmail;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public int getRewardPoints() {
        return rewardPoints;
    }

    public String getUserGrade() {
        return userGrade;
    }

}
