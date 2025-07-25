package com.ssafy.ottereview.user.entity;

import lombok.AccessLevel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)  // JPA 기본 생성자 필수
@AllArgsConstructor
@Builder
@Table(name = "users")
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

    @Column(name = "installation_id")
    private Long installationId;

    @Column(name = "reward_points")
    private int rewardPoints;

    @Column(name = "user_grade")
    private String userGrade;


}
