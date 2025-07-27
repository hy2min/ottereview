package com.ssafy.ottereview.github.dto;

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
    
}
