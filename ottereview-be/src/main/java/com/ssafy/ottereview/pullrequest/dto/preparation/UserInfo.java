package com.ssafy.ottereview.pullrequest.dto.preparation;

import com.ssafy.ottereview.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInfo {

    private Long id;
    private String githubUsername;
    private String githubEmail;

    public static UserInfo of(Long id, String githubUsername, String githubEmail) {
        return UserInfo.builder()
                .id(id)
                .githubUsername(githubUsername)
                .githubEmail(githubEmail)
                .build();
    }
}
