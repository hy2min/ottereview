package com.ssafy.ottereview.reviewer.dto;

import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.reviewer.entity.Reviewer;
import com.ssafy.ottereview.user.dto.UserResponseDto;
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

    private PullRequestResponse pullRequest;

    private UserResponseDto user;

    public static ReviewerResponse fromEntity(Reviewer reviewer) {
        return ReviewerResponse.builder()
                .id(reviewer.getId())
                .pullRequest(PullRequestResponse.fromEntity(reviewer.getPullRequest()))
                .user(UserResponseDto.fromEntity(reviewer.getUser()))
                .build();
    }
}
