package com.ssafy.ottereview.githubapp.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class GithubAccountResponse {
    
    private Long installationId;
    private String name;
    private String type;
    private Long githubId;
    
}
