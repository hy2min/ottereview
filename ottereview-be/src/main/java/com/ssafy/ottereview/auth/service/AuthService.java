package com.ssafy.ottereview.auth.service;

import com.ssafy.ottereview.auth.jwt.dto.LoginResponseDto;

import com.ssafy.ottereview.auth.dto.GithubUserDto;

public interface AuthService {
    LoginResponseDto githubLogin(String code);

    LoginResponseDto refreshAccessToken(String refreshToken);

    void logout(Long userId);

    GithubUserDto requestGithubUser(String githubAccessToken);

}
