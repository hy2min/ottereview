package com.ssafy.ottereview.auth.jwt.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AccessTokenResponseDto {
    
    private String accessToken;
}
