package com.ssafy.ottereview.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GithubUserDto {
    
    private String login;
    private Long id;
    private String email;
    private String type;
    private String avatarUrl;
}
