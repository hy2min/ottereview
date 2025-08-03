package com.ssafy.ottereview.user.dto;

import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class UserResponseDto {
    private Long id;
    private String githubUsername;
    private String githubEmail;
    private String profileImageUrl;
    private int rewardPoints;
    private String userGrade;
}
