package com.ssafy.ottereview.auth.service;


import com.ssafy.ottereview.auth.dto.GithubUserDto;
import com.ssafy.ottereview.auth.jwt.dto.AccessTokenResponseDto;

public interface AuthService {

    AccessTokenResponseDto githubLogin(String code);

    AccessTokenResponseDto refreshAccessToken(String refreshToken);

    void logout(Long userId);

    GithubUserDto requestGithubUser(String githubAccessToken);

}
