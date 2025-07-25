package com.ssafy.ottereview.auth.controller;

import com.ssafy.ottereview.auth.jwt.dto.AccessTokenResponseDto;
import com.ssafy.ottereview.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    private final AuthService authService;

    // Refresh Token으로 Access Token 재발급
    @PostMapping("/refresh")
    public ResponseEntity<AccessTokenResponseDto> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        return ResponseEntity.ok(authService.refreshAccessToken(refreshToken));
    }

    // GitHub 로그인 콜백
    @GetMapping(value = "/github/callback", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AccessTokenResponseDto> githubCallback(@RequestParam String code) {
        return ResponseEntity.ok(authService.githubLogin(code));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Authentication authentication) {
        Long userId = Long.valueOf(authentication.getName());
        authService.logout(userId);
        return ResponseEntity.ok().build();
    }

}
