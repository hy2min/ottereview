package com.ssafy.ottereview.pullrequest.dto.info;

import com.ssafy.ottereview.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PullRequestUserInfo {

    private Long id;
    private String githubUsername;
    private String githubEmail;

    public static PullRequestUserInfo fromEntity(User user) {
        return PullRequestUserInfo.builder()
                .id(user.getId())
                .githubUsername(user.getGithubUsername())
                .githubEmail(user.getGithubEmail())
                .build();
    }
}
