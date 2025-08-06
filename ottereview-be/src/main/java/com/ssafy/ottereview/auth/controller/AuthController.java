package com.ssafy.ottereview.auth.controller;

import com.ssafy.ottereview.auth.jwt.dto.AccessTokenResponseDto;
import com.ssafy.ottereview.auth.jwt.dto.LoginResponseDto;
import com.ssafy.ottereview.auth.service.AuthService;

import java.time.Duration;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    @Value("${APP_JWT_REFRESH_EXPMIN}")
    private long refreshExpMin;
    
    private final AuthService authService;
    
    @Value("${github.oauth.client-id}")
    private String clientId;

    @Value("${github.oauth.redirect-uri}")
    private String redirectUri;

    // Refresh Token으로 Access Token 재발급
    @PostMapping("/refresh")
    public ResponseEntity<AccessTokenResponseDto> refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.status(401).build(); // 추후 커스텀 에러 처리 필요
        }
        LoginResponseDto loginResponseDto = authService.refreshAccessToken(refreshToken);
        return ResponseEntity.ok(new AccessTokenResponseDto(loginResponseDto.getAccessToken()));
    }

    // 로그인 요청
    @GetMapping("/login")
    public ResponseEntity<Void> login() {
        return ResponseEntity.status(302)
                .header("Location", "https://github.com/login/oauth/authorize?client_id="+clientId+"&redirect_uri="+redirectUri+"&scope=read:user,user:email")
                .build();
    }


    // GitHub 로그인 콜백
    @GetMapping(value = "/github/callback", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AccessTokenResponseDto> githubCallback(@RequestParam String code, HttpServletResponse response) {
        LoginResponseDto tokens = authService.githubLogin(code);

        // Refresh Token은 쿠키에 저장
        ResponseCookie cookie = ResponseCookie.from("refreshToken", tokens.getRefreshToken())
                .httpOnly(true)
                .secure(false)          // HTTPS 환경이면 true, 로컬 개발 시 false 가능
                .path("/")
                .sameSite("LAX")
                .maxAge(Duration.ofMinutes(refreshExpMin))  // 7일
                .build();

        response.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.ok(new AccessTokenResponseDto(tokens.getAccessToken()));
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Authentication authentication, HttpServletResponse response) {
        Long userId = Long.valueOf(authentication.getName());
        authService.logout(userId);
        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header("Set-Cookie", deleteCookie.toString())
                .build();
    }
    
}
