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
    private long userId;

    @Column(name = "github_username", nullable = false , columnDefinition = "varchar(50)")
    private String githubUsername;

    @Column(name = "github_email", nullable = false , columnDefinition = "varcher(50)")
    private String githubEmail;

    @Column(name = "profile_image_url", columnDefinition = "varchar(100)")
    private String profileImageUrl;

    @Column(name = "access_token")
    private String accessToken;

    @Column(name = "reward_points", columnDefinition = "int")
    private int rewardPoints;

    @Column(name = "user_grade", columnDefinition = "varchar(50)")
    private String userGrade;

    public long getUserId() {
        return userId;
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
