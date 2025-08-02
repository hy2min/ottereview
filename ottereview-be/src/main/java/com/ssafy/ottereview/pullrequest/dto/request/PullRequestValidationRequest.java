package com.ssafy.ottereview.pullrequest.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PullRequestValidationRequest {
    
    private String source;
    private String target;
    
}
