package com.ssafy.ottereview.preparation.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.preparation.dto.PreparationResult;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Transactional
@RequiredArgsConstructor
@Service
@Slf4j
public class PreparationRedisRepository {
    
    private static final Duration CACHE_TTL = Duration.ofHours(2);
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    
    /**
     * PR 준비 정보를 Redis에 저장
     */
    public void savePrepareInfo(Long repoId, PreparationResult prepareInfo) {
        try {
            String mainKey = generateMainKey(repoId, prepareInfo.getSource(), prepareInfo.getTarget());
            
            String jsonData = objectMapper.writeValueAsString(prepareInfo);
            
            redisTemplate.opsForValue()
                    .set(mainKey, jsonData, CACHE_TTL);
            
            log.info("PR 준비 정보 저장 완료: {}", mainKey);
            
        } catch (Exception e) {
            log.error("PR 준비 정보 저장 실패", e);
            throw new RuntimeException("Redis 저장 실패", e);
        }
    }
    
    /**
     * PR 준비 정보 조회
     */
    public PreparationResult getPrepareInfo(Long repoId,
            String source, String target) {
        try {
            String key = generateMainKey(repoId, source, target);
            String jsonData = redisTemplate.opsForValue()
                    .get(key);
            
            return objectMapper.readValue(jsonData, PreparationResult.class);
            
        } catch (Exception e) {
            log.error("PR 준비 정보 조회 실패", e);
            return null;
        }
    }
    
    /**
     * PR 준비 정보 업데이트(리뷰어 추가)
     */
    public void updatePrepareInfo(Long repoId, PreparationResult updatedPrepareInfo) {
        try {
            String mainKey = generateMainKey(repoId, updatedPrepareInfo.getSource(), updatedPrepareInfo.getTarget());
            
            // JSON으로 변환하여 저장
            String updatedJsonData = objectMapper.writeValueAsString(updatedPrepareInfo);
            redisTemplate.opsForValue()
                    .set(mainKey, updatedJsonData, CACHE_TTL);
            
            log.info("PR 준비 정보 업데이트 완료: {}", mainKey);
            
        } catch (Exception e) {
            log.error("PR 준비 정보 업데이트 실패", e);
            throw new RuntimeException("Redis 업데이트 실패", e);
        }
    }
    
    /**
     * PR 준비 정보 삭제
     */
    public void deletePrepareInfo(Long repoId, String source, String target) {
        try {
            String mainKey = generateMainKey(repoId, source, target);
            
            // 메인 데이터 삭제
            redisTemplate.delete(mainKey);
            
            log.info("PR 준비 정보 삭제 완료: {}", mainKey);
        } catch (Exception e) {
            log.error("PR 준비 정보 삭제 실패", e);
        }
    }
    
    // ========== 키 생성 메서드들 ==========
    
    /**
     * 메인 키 생성: pr:prepare:{userId}:{repoId}:{source}:{target}
     */
    private String generateMainKey(Long repoId, String source, String target) {
        return String.format("pr:prepare:%d:%s:%s",
                repoId, sanitizeBranchName(source), sanitizeBranchName(target));
    }
    
    /**
     * 미디어 파일들을 Redis에 저장
     */
    public void saveMediaFiles(String cacheKey, MultipartFile[] mediaFiles) {
        try {
            for (int i = 0; i < mediaFiles.length; i++) {
                MultipartFile file = mediaFiles[i];
                String fileKey = cacheKey + ":file:" + i;
                
                // 파일의 메타정보와 바이너리 데이터를 각각 저장
                redisTemplate.opsForValue().set(fileKey + ":name", file.getOriginalFilename(), CACHE_TTL);
                redisTemplate.opsForValue().set(fileKey + ":contentType", file.getContentType(), CACHE_TTL);
                redisTemplate.opsForValue().set(fileKey + ":size", String.valueOf(file.getSize()), CACHE_TTL);
                
                // 바이너리 데이터를 Base64로 인코딩하여 저장
                byte[] fileBytes = file.getBytes();
                String base64Data = java.util.Base64.getEncoder().encodeToString(fileBytes);
                redisTemplate.opsForValue().set(fileKey + ":data", base64Data, CACHE_TTL);
            }
            
            // 파일 개수 저장
            redisTemplate.opsForValue().set(cacheKey + ":count", String.valueOf(mediaFiles.length), CACHE_TTL);
            
            log.info("미디어 파일 Redis 저장 완료 - Key: {}, 파일 수: {}", cacheKey, mediaFiles.length);
            
        } catch (Exception e) {
            log.error("미디어 파일 Redis 저장 실패 - Key: {}", cacheKey, e);
            throw new RuntimeException("미디어 파일 Redis 저장 실패", e);
        }
    }
    
    /**
     * Redis에서 미디어 파일들을 조회
     */
    public MultipartFile[] getMediaFiles(String cacheKey) {
        try {
            String countStr = redisTemplate.opsForValue().get(cacheKey + ":count");
            if (countStr == null) {
                log.debug("미디어 파일 정보가 없습니다 - Key: {}", cacheKey);
                return null;
            }
            
            int fileCount = Integer.parseInt(countStr);
            List<MultipartFile> files = new ArrayList<>();
            
            for (int i = 0; i < fileCount; i++) {
                String fileKey = cacheKey + ":file:" + i;
                
                String fileName = redisTemplate.opsForValue().get(fileKey + ":name");
                String contentType = redisTemplate.opsForValue().get(fileKey + ":contentType");
                String sizeStr = redisTemplate.opsForValue().get(fileKey + ":size");
                String base64Data = redisTemplate.opsForValue().get(fileKey + ":data");
                
                if (fileName != null && contentType != null && base64Data != null) {
                    byte[] fileBytes = java.util.Base64.getDecoder().decode(base64Data);
                    MultipartFile file = new CustomMultipartFile(
                        "file" + i,
                        fileName,
                        contentType,
                        fileBytes
                    );
                    files.add(file);
                } else {
                    log.warn("파일 정보 불완전 - fileKey: {}", fileKey);
                }
            }
            
            log.info("미디어 파일 Redis 조회 완료 - Key: {}, 조회된 파일 수: {}", cacheKey, files.size());
            
            return files.toArray(new MultipartFile[0]);
            
        } catch (Exception e) {
            log.error("미디어 파일 Redis 조회 실패 - Key: {}", cacheKey, e);
            return null;
        }
    }
    
    /**
     * 미디어 파일 정보를 Redis에서 삭제
     */
    public void deleteMediaFiles(String cacheKey) {
        try {
            String countStr = redisTemplate.opsForValue().get(cacheKey + ":count");
            if (countStr != null) {
                int fileCount = Integer.parseInt(countStr);
                
                // 각 파일 관련 키들 삭제
                for (int i = 0; i < fileCount; i++) {
                    String fileKey = cacheKey + ":file:" + i;
                    redisTemplate.delete(fileKey + ":name");
                    redisTemplate.delete(fileKey + ":contentType");
                    redisTemplate.delete(fileKey + ":size");
                    redisTemplate.delete(fileKey + ":data");
                }
                
                // count 키 삭제
                redisTemplate.delete(cacheKey + ":count");
            }
            
            log.info("미디어 파일 정보 삭제 완료 - Key: {}", cacheKey);
            
        } catch (Exception e) {
            log.error("미디어 파일 정보 삭제 실패 - Key: {}", cacheKey, e);
        }
    }

    /**
     * 커스텀 MultipartFile 구현체 (Redis에서 복원용)
     */
    private static class CustomMultipartFile implements MultipartFile {
        private final String name;
        private final String originalFilename;
        private final String contentType;
        private final byte[] content;
        
        public CustomMultipartFile(String name, String originalFilename, String contentType, byte[] content) {
            this.name = name;
            this.originalFilename = originalFilename;
            this.contentType = contentType;
            this.content = content;
        }
        
        @Override
        public String getName() {
            return name;
        }
        
        @Override
        public String getOriginalFilename() {
            return originalFilename;
        }
        
        @Override
        public String getContentType() {
            return contentType;
        }
        
        @Override
        public boolean isEmpty() {
            return content == null || content.length == 0;
        }
        
        @Override
        public long getSize() {
            return content.length;
        }
        
        @Override
        public byte[] getBytes() throws IOException {
            return content;
        }
        
        @Override
        public InputStream getInputStream() throws IOException {
            return new ByteArrayInputStream(content);
        }
        
        @Override
        public void transferTo(File dest) throws IOException, IllegalStateException {
            throw new UnsupportedOperationException("transferTo not supported");
        }
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
