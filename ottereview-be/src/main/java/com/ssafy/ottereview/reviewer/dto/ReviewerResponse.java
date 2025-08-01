package com.ssafy.ottereview.reviewer.dto;

import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.reviewer.entity.Reviewer;
import com.ssafy.ottereview.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewerResponse {

    private Long id;

    private PullRequest pullRequest;

    private User user;

    public static ReviewerResponse of(Reviewer reviewer) {
        return ReviewerResponse.builder()
                .id(reviewer.getId())
                .pullRequest(reviewer.getPullRequest())
                .user(reviewer.getUser())
                .build();
    }
}
