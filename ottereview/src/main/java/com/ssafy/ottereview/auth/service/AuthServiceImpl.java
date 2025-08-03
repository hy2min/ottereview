package com.ssafy.ottereview.auth.service;

import com.ssafy.ottereview.auth.dto.GithubUserDto;
import com.ssafy.ottereview.auth.jwt.dto.AccessTokenResponseDto;
import com.ssafy.ottereview.auth.jwt.dto.LoginResponseDto;
import com.ssafy.ottereview.auth.jwt.service.TokenService;
import com.ssafy.ottereview.auth.jwt.util.JwtUtil;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import com.ssafy.ottereview.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {
    @Value("${github.oauth.client-id}")
    private String clientId;
    @Value("${github.oauth.client-secret}")
    private String clientSecret;
    @Value("${github.oauth.redirect-uri}")
    private String redirectUri;

    private final JwtUtil jwtUtil;
    private final TokenService tokenService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    @Transactional
    public LoginResponseDto githubLogin(String code) {
        // GitHub Access Token 요청
        String githubAccessToken = requestGithubAccessToken(code);
        // GitHub 사용자 정보 요청
        GithubUserDto githubUser = requestGithubUser(githubAccessToken);
        // DB 사용자 조회 or 회원가입
        User user = userRepository.findByGithubEmail(githubUser.getEmail())
                .orElseGet(() -> registerUser(githubUser));
        // JWT 발급 및 Refresh Token 저장
        String accessToken = jwtUtil.createAccessToken(user);
        String refreshToken = jwtUtil.createRefreshToken(user);
        tokenService.saveRefreshToken(user.getId(), refreshToken);
        return new LoginResponseDto(accessToken, refreshToken);
    }

    private User registerUser(GithubUserDto githubUser) {
        User user = User.builder()
                .githubUsername(githubUser.getLogin())
                .githubEmail(githubUser.getEmail())
                .profileImageUrl(githubUser.getAvatarUrl())
                .rewardPoints(0)
                .userGrade("BASIC")
                .build();

        userService.createUser(user);
        return userRepository.save(user);
    }

    public GithubUserDto requestGithubUser(String githubAccessToken) {
        String url = "https://api.github.com/user";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(githubAccessToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<Map<String, Object>> responseEntity =
                restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        entity,
                        new ParameterizedTypeReference<>() {
                        }
                );
        Map<String, Object> response = responseEntity.getBody();
        String login = (String) response.get("login");
        String email = (String) response.get("email");
        String avatarUrl = (String) response.get("avatar_url");
        if (email == null) {
            email = requestPrimaryEmail(githubAccessToken);
            if (email == null) {
                throw new RuntimeException("GitHub email not provided or private.");
            }
        }

        return new GithubUserDto(login, email, avatarUrl);
    }

    // 이메일 공개가 되어 있지 않으면 토큰으로 가져오기
    private String requestPrimaryEmail(String githubAccessToken) {
        String url = "https://api.github.com/user/emails";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(githubAccessToken);

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<List<Map<String, Object>>> responseEntity =
                restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        entity,
                        new ParameterizedTypeReference<>() {
                        }
                );
        List<Map<String, Object>> response = responseEntity.getBody();
        if (response != null) {
            for (Map<String, Object> emailEntry : response) {
                Boolean primary = (Boolean) emailEntry.get("primary");
                Boolean verified = (Boolean) emailEntry.get("verified");
                if (Boolean.TRUE.equals(primary) && Boolean.TRUE.equals(verified)) {
                    return (String) emailEntry.get("email");
                }
            }
        }
        return null;
    }

    private String requestGithubAccessToken(String code) {
        log.info("clientId={}, clientSecret={}, redirectUri={}", clientId, clientSecret, redirectUri);
        String url = "https://github.com/login/oauth/access_token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("code", code);
        params.add("redirect_uri", redirectUri);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        ResponseEntity<Map<String, Object>> responseEntity =
                restTemplate.exchange(
                        url,
                        HttpMethod.POST,
                        request,
                        new ParameterizedTypeReference<>() {
                        }
                );

        Map<String, Object> response = responseEntity.getBody();
        return (String) response.get("access_token");
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponseDto refreshAccessToken(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }
        Long userId = Long.valueOf(jwtUtil.getClaims(refreshToken).getSubject());

        String storedToken = tokenService.getRefreshToken(userId);
        if (storedToken == null || !storedToken.equals(refreshToken)) {
            throw new RuntimeException("Refresh token not found or mismatched");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String newAccessToken = jwtUtil.createAccessToken(user);
        return new LoginResponseDto(newAccessToken, refreshToken);
    }

    public void logout(Long userId) {
        tokenService.deleteRefreshToken(userId);
    }
}
