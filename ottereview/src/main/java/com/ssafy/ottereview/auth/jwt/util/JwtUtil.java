package com.ssafy.ottereview.auth.jwt.util;

import com.ssafy.ottereview.user.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

@Component
@Slf4j
public class JwtUtil {
    private final SecretKey key;
    private final long accessExpMs;
    private final long refreshExpMs;

    public JwtUtil(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-expmin}") long accessExpMin,
            @Value("${app.jwt.refresh-expmin}") long refreshExpMin
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessExpMs = accessExpMin * 60 * 1000;   // 분 → ms 변환
        this.refreshExpMs = refreshExpMin * 60 * 1000;
    }

    // 이메일은 accessToken 만들때만 사용
    public String createAccessToken(User user) {
        return createToken(String.valueOf(user.getId()), accessExpMs, Map.of("email", user.getGithubEmail(), "type", "access"));
    }

    public String createRefreshToken(User user) {
        return createToken(String.valueOf(user.getId()), refreshExpMs, Map.of("type", "refresh"));
    }

    private String createToken(String subject, long expireMs, Map<String, Object> claims) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expireMs);

        String token = Jwts.builder()
                .setSubject(subject)
                .addClaims(claims)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
        log.debug("JWT 생성됨: {}", token);
        return token;
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            log.debug("JWT 검증 실패: {}", e.getMessage());
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getEmail(String token) {
        return getClaims(token).get("email", String.class);
    }
}
