package com.ssafy.ottereview.preparation.dto;

import com.ssafy.ottereview.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrUserInfo {

    private Long id;
    private Long githubId;
    private String githubUsername;
    private String githubEmail;

    public static PrUserInfo fromEntity(User user) {
        return PrUserInfo.builder()
                .id(user.getId())
                .githubId(user.getGithubId())
                .githubUsername(user.getGithubUsername())
                .githubEmail(user.getGithubEmail())
                .build();
    }
}
