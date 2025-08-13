package com.ssafy.ottereview.pullrequest.dto.info;

import com.ssafy.ottereview.reviewer.entity.Reviewer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PullRequestReviewerInfo {

    private Long id;
    private Long userId;
    private String githubUsername;
    private String githubEmail;
    private String state;

    public static PullRequestReviewerInfo fromEntity(Reviewer reviewer) {
        return PullRequestReviewerInfo.builder()
                .id(reviewer.getId())
                .userId(reviewer.getUser().getId())
                .githubUsername(reviewer.getUser().getGithubUsername())
                .githubEmail(reviewer.getUser().getGithubEmail())
                .state(reviewer.getStatus().toString())
                .build();

    }
}
