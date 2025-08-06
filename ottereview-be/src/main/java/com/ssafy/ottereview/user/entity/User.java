package com.ssafy.ottereview.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "github_id", nullable = false)
    private Long githubId;

    @Column(name = "github_username", nullable = false)
    private String githubUsername;

    @Column(name = "github_email")
    private String githubEmail;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "reward_points")
    private int rewardPoints;

    @Column(name = "user_grade")
    private String userGrade;
}
