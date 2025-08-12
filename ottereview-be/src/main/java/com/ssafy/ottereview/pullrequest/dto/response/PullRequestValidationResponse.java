package com.ssafy.ottereview.pullrequest.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class PullRequestValidationResponse {

    private Boolean isExist;
    private Long prId;
}
