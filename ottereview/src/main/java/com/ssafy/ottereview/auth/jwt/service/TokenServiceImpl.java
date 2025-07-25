package com.ssafy.ottereview.auth.jwt.service;


import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

/**
 * refresh token 레디스 간 로직 관리
 */
@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    @Value("${app.jwt.refresh-expmin}")
    private long refreshExpMin;
    
    @Override
    public void saveRefreshToken(Long userId, String refreshToken) {
        String key = "refresh:" + userId;
        redisTemplate.opsForValue()
                .set(key, refreshToken, refreshExpMin, TimeUnit.MINUTES);
    }
    
    @Override
    public String getRefreshToken(Long userId) {
        return (String) redisTemplate.opsForValue()
                .get("refresh:" + userId);
    }
    
    @Override
    public void deleteRefreshToken(Long userId) {
        redisTemplate.delete("refresh:" + userId);
    }
    
}
