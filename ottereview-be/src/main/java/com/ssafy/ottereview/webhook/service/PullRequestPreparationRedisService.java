package com.ssafy.ottereview.webhook.service;

import com.ssafy.ottereview.webhook.dto.PullRequestPrepareData;
import com.ssafy.ottereview.webhook.dto.PushEventInfo;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@RequiredArgsConstructor
@Service
@Slf4j
public class PullRequestPreparationRedisService {
    
    private static final String PR_CACHE_PREFIX = "pr-prepare:";
    private static final Duration CACHE_TTL = Duration.ofHours(24);
    private final RedisTemplate<String, Object> redisTemplate;
    
    /**
     * PullRequestData를 Redis에 저장
     */
    public void savePullRequestData(PullRequestPrepareData prData) {
        try {
            String cacheKey = createCacheKey(prData.getPushInfo());
            
            redisTemplate.opsForValue()
                    .set(cacheKey, prData, CACHE_TTL);
            
            log.info("PR 데이터 캐시 저장 완료: {}", cacheKey);
        } catch (Exception e) {
            log.error("PR 데이터 캐시 저장 실패", e);
            throw new RuntimeException("캐시 저장 실패", e);
        }
    }
    
    /**
     * Redis에서 PR 데이터 조회
     */
    public PullRequestPrepareData getCachedPullRequestData(PushEventInfo pushInfo) {
        try {
            String cacheKey = createCacheKey(pushInfo);
            Object cached = redisTemplate.opsForValue()
                    .get(cacheKey);
            
            if (cached instanceof PullRequestPrepareData) {
                log.info("PR 데이터 캐시 조회 성공: {}", cacheKey);
                return (PullRequestPrepareData) cached;
            }
            
            log.info("PR 데이터 캐시 미스: {}", cacheKey);
            return null;
            
        } catch (Exception e) {
            log.error("PR 데이터 캐시 조회 실패", e);
            return null;
        }
    }
    
    /**
     * 캐시 삭제 (PR 생성 완료 후)
     */
    public void clearCache(PushEventInfo pushInfo) {
        try {
            String cacheKey = createCacheKey(pushInfo);
            redisTemplate.delete(cacheKey);
            log.info("PR 데이터 캐시 삭제 완료: {}", cacheKey);
        } catch (Exception e) {
            log.error("PR 데이터 캐시 삭제 실패", e);
        }
    }
    
    private String createCacheKey(PushEventInfo pushInfo) {
        return PR_CACHE_PREFIX +
                pushInfo.getRepoFullName() + ":" +
                pushInfo.getBranchName() + ":" +
                pushInfo.getAfterSha();
    }
}
