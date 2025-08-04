package com.ssafy.ottereview.pullrequest.dto.preparation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewerInfo {
    
    private Long id;
    private String githubUsername;
    private String githubEmail;
    private String profileImageUrl;
    private int rewardPoints;
    private String userGrade;
}
