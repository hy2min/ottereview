package com.ssafy.ottereview.user.entity;

import com.ssafy.ottereview.common.entity.BaseEntity;
import com.ssafy.ottereview.user.dto.UserResponseDto;
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
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "github_id", nullable = false, unique = true)
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

    public static User to(UserResponseDto userResponseDto){
        return User.builder()
                .githubEmail(userResponseDto.getGithubEmail())
                .githubId(userResponseDto.getGithubId())
                .githubUsername(userResponseDto.getGithubUsername())
                .profileImageUrl(userResponseDto.getProfileImageUrl())
                .rewardPoints(userResponseDto.getRewardPoints())
                .userGrade(userResponseDto.getUserGrade())
                .type(userResponseDto.getType())
                .id(userResponseDto.getId()).build();
    }
}
