package com.ssafy.ottereview.ai.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.ai.dto.request.AiRequest;
import com.ssafy.ottereview.ai.dto.response.AiResult;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
@Slf4j
public class AiRedisRepository {
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    
    /**
     * Ai 정보를 Redis에 저장
     */
    public void saveAiInfo(AiRequest request, AiResult result) {
        try {
            String mainKey = generateMainKey(request.getRepoId(), request.getSource(), request.getTarget());
            
            String jsonData = objectMapper.writeValueAsString(result);
            
            redisTemplate.opsForValue()
                    .set(mainKey, jsonData, CACHE_TTL);
            
            log.info("Ai 정보 저장 완료: {}", mainKey);
            
        } catch (Exception e) {
            log.error("Ai 정보 저장 실패", e);
            throw new RuntimeException("Redis 저장 실패", e);
        }
    }
    
    /**
     * Ai 정보 조회
     */
    public AiResult getAiInfo(AiRequest request) {
        try {
            String key = generateMainKey(request.getRepoId(), request.getSource(), request.getTarget());
            String jsonData = redisTemplate.opsForValue()
                    .get(key);
            
            // null 체크 추가
            if (jsonData == null || jsonData.trim().isEmpty()) {
                log.warn("Redis에서 데이터를 찾을 수 없습니다. key: {}", key);
                return null;
            }
            
            return objectMapper.readValue(jsonData, AiResult.class);
            
        } catch (Exception e) {
            log.error("Ai 정보 조회 실패", e);
            return null;
        }
    }
    
    /**
     * Ai 정보 삭제
     */
    public void deleteAiInfo(AiRequest request) {
        try {
            String mainKey = generateMainKey(request.getRepoId(), request.getSource(), request.getTarget());
            
            // 메인 데이터 삭제
            redisTemplate.delete(mainKey);
            
            log.info("Ai 정보 삭제 완료: {}", mainKey);
        } catch (Exception e) {
            log.error("Ai 정보 삭제 실패", e);
        }
    }
    
    // ========== 키 생성 메서드들 ==========
    
    /**
     * 메인 키 생성: pr:ai:{repoId}:{source}:{target}
     */
    private String generateMainKey(Long repoId, String source, String target) {
        return String.format("pr:ai:%d:%s:%s",
                repoId, sanitizeBranchName(source), sanitizeBranchName(target));
    }
    
    /**
     * 브랜치명 정제 (Redis 키에 사용할 수 없는 문자 처리)
     */
    private String sanitizeBranchName(String branchName) {
        if (branchName == null) {
            return "null";
        }
        // 특수문자를 안전한 문자로 변경
        return branchName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
