package com.ssafy.ottereview.user.dto;

import com.ssafy.ottereview.user.entity.User;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class UserResponseDto {
    private Long id;
    private Long githubId;
    private String githubUsername;
    private String githubEmail;
    private String type;
    private String profileImageUrl;
    private int rewardPoints;
    private String userGrade;

    public static UserResponseDto fromEntity(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getGithubId(),
                user.getGithubUsername(),
                user.getGithubEmail(),
                user.getType(),
                user.getProfileImageUrl(),
                user.getRewardPoints(),
                user.getUserGrade()
        );
    }
}
