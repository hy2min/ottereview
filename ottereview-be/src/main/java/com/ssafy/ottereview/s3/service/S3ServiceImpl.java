package com.ssafy.ottereview.s3.service;

import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.s3.exception.S3ErrorCode;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.Delete;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.ObjectIdentifier;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3ServiceImpl implements S3Service {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${cloud.aws.S3.bucket}")
    private String bucketName;

    @Value("${cloud.aws.region.static}")
    private String region;

    // 파일 검증을 위한 상수
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".webm"
    );
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/aac", 
            "audio/ogg", "audio/flac", "audio/x-m4a", "audio/webm"
    );

    @Override
    public String uploadFile(MultipartFile file, Long reviewId) {
        // 파일 검증
        validateFile(file, reviewId);
        
        try {
            String fileName = String.format("%s%s", System.currentTimeMillis(),
                    file.getOriginalFilename());
            String fileKey = String.format("voice-comments/review_%d/%s", reviewId, fileName);

            Map<String, String> metadata = new HashMap<>();
            metadata.put("fileKey", fileKey);
            metadata.put("fileName", fileName);
            metadata.put("reviewId", reviewId.toString());

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileKey)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .metadata(metadata)
                    .build();

            s3Client.putObject(putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            return fileKey;
        } catch (Exception e) {
            log.error("음성 파일 업로드 실패 - review: {}, File: {}", reviewId, file.getOriginalFilename(),
                    e);
            throw new RuntimeException("음성 파일 업로드 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public String uploadDesFile(MultipartFile file, Long descriptionId) {
        // 파일 검증 (descriptionId를 reviewId처럼 사용)
        validateFile(file, descriptionId);
        
        try {
            String fileName = String.format("%s%s", System.currentTimeMillis(),
                    file.getOriginalFilename());
            String fileKey = String.format("voice-comments/pullrequest_%d/%s", descriptionId, fileName);

            Map<String, String> metadata = new HashMap<>();
            metadata.put("fileKey", fileKey);
            metadata.put("fileName", fileName);
            metadata.put("reviewId", descriptionId.toString());

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileKey)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .metadata(metadata)
                    .build();

            s3Client.putObject(putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            return fileKey;
        } catch (Exception e) {
            log.error("음성 파일 업로드 실패 - review: {}, File: {}", descriptionId, file.getOriginalFilename(),
                    e);
            throw new RuntimeException("음성 파일 업로드 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFiles(Long reviewId) {
        try {
            String prefix = String.format("voice-comments/review_%d/", reviewId);

            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .build();
            ListObjectsV2Response listResponse = s3Client.listObjectsV2(listRequest);
            List<S3Object> objects = listResponse.contents();

            List<ObjectIdentifier> objectsToDelete = objects.stream()
                    .map(obj -> ObjectIdentifier.builder().key(obj.key()).build())
                    .collect(Collectors.toList());

            Delete delete = Delete.builder()
                    .objects(objectsToDelete)
                    .build();

            DeleteObjectsRequest deleteRequest = DeleteObjectsRequest.builder()
                    .bucket(bucketName)
                    .delete(delete)
                    .build();

            s3Client.deleteObjects(deleteRequest);
        } catch (Exception e) {
            throw new RuntimeException("파일 삭제 실패", e);
        }
    }

    @Override
    public void deleteFile(String fileKey) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileKey)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("S3에서 파일 삭제 완료 - Key: {}", fileKey);

        } catch (S3Exception e) {
            log.error("S3 파일 삭제 실패 - Key: {}, Error: {}", fileKey, e.getMessage());
            throw new RuntimeException("파일 삭제에 실패했습니다: " + e.getMessage());
        } catch (Exception e) {
            log.error("파일 삭제 중 예기치 못한 오류 발생 - Key: {}", fileKey, e);
            throw new RuntimeException("파일 삭제 중 오류가 발생했습니다.");
        }
    }

    @Override
    public List<S3Object> listVoiceFilesByReviewId(Long reviewId) {
        try {
            String prefix = String.format("voice-comments/review_%d/", reviewId);
            ListObjectsV2Request listObjectsV2Request = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .build();
            ListObjectsV2Response listObjectsV2Response = s3Client.listObjectsV2(
                    listObjectsV2Request);
            return listObjectsV2Response.contents();
        } catch (Exception e) {
            throw new RuntimeException("파일 목록 조회 실패", e);
        }
    }

    /**
     * 업로드된 파일들을 정리하는 보상 트랜잭션 메서드
     */
    /**
     * 파일 검증을 수행하는 메서드
     */
    private void validateFile(MultipartFile file, Long id) {
        if (file == null) {
            throw new IllegalArgumentException("파일이 null입니다.");
        }
        
        if (id == null) {
            throw new IllegalArgumentException("ID가 null입니다.");
        }
        
        if (file.isEmpty()) {
            throw new IllegalArgumentException("빈 파일은 업로드할 수 없습니다.");
        }
        
        // 파일 크기 검증
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                String.format("파일 크기가 너무 큽니다. 최대 %dMB까지 업로드 가능합니다.", 
                    MAX_FILE_SIZE / (1024 * 1024)));
        }
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new IllegalArgumentException("파일명이 유효하지 않습니다.");
        }
        
        // 파일 확장자 검증
        String fileExtension = getFileExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(fileExtension.toLowerCase())) {
            throw new IllegalArgumentException(
                String.format("허용되지 않는 파일 형식입니다. 허용 형식: %s", 
                    String.join(", ", ALLOWED_EXTENSIONS)));
        }
        
        // Content-Type 검증
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                String.format("허용되지 않는 파일 타입입니다. Content-Type: %s", contentType));
        }
        
        // 파일명 안전성 검증 (경로 탐색 공격 방지)
        if (originalFilename.contains("../") || originalFilename.contains("..\\")
                || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new IllegalArgumentException("파일명에 허용되지 않는 문자가 포함되어 있습니다.");
        }
        
        log.info("파일 검증 완료 - 파일명: {}, 크기: {}, Content-Type: {}", 
            originalFilename, file.getSize(), contentType);
    }
    
    /**
     * 파일 확장자를 추출하는 메서드
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        
        int lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return "";
        }
        
        return filename.substring(lastDotIndex);
    }
    
    @Override
    public String generatePresignedUrl(String fileKey, int expirationMinutes) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileKey)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(expirationMinutes))
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            String presignedUrl = presignedRequest.url().toString();
            
            log.info("Pre-signed URL 생성 완료 - 파일 키: {}, 만료시간: {}분", fileKey, expirationMinutes);
            return presignedUrl;
            
        } catch (Exception e) {
            log.error("Pre-signed URL 생성 실패 - 파일 키: {}, 오류: {}", fileKey, e.getMessage());
            throw new BusinessException(S3ErrorCode.S3_PRESIGNED_URL_CREATE_FAILED);
        }
    }

    @Override
    public Map<String, String> generatePresignedUrlsForReview(Long reviewId, int expirationMinutes) {
        try {
            List<S3Object> voiceFiles = listVoiceFilesByReviewId(reviewId);
            Map<String, String> presignedUrls = new HashMap<>();
            
            for (S3Object s3Object : voiceFiles) {
                String fileKey = s3Object.key();
                String presignedUrl = generatePresignedUrl(fileKey, expirationMinutes);
                presignedUrls.put(fileKey, presignedUrl);
            }
            
            log.info("리뷰 ID {}에 대한 {} 개 파일의 Pre-signed URL 생성 완료", reviewId, presignedUrls.size());
            return presignedUrls;
            
        } catch (Exception e) {
            log.error("리뷰 ID {}의 Pre-signed URL 생성 실패: {}", reviewId, e.getMessage());
            throw new RuntimeException("음성 파일 URL 생성에 실패했습니다: " + e.getMessage(), e);
        }
    }

    @Override
    public List<S3Object> listVoiceFilesByPullRequestId(Long pullRequestId) {
        try {
            String prefix = String.format("voice-comments/pullrequest_%d/", pullRequestId);
            ListObjectsV2Request listObjectsV2Request = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .build();
            ListObjectsV2Response listObjectsV2Response = s3Client.listObjectsV2(
                    listObjectsV2Request);
            return listObjectsV2Response.contents();
        } catch (Exception e) {
            throw new RuntimeException("Pull Request 파일 목록 조회 실패", e);
        }
    }

    @Override
    public Map<String, String> generatePresignedUrlsForPullRequest(Long pullRequestId, int expirationMinutes) {
        try {
            List<S3Object> voiceFiles = listVoiceFilesByPullRequestId(pullRequestId);
            Map<String, String> presignedUrls = new HashMap<>();
            
            for (S3Object s3Object : voiceFiles) {
                String fileKey = s3Object.key();
                String presignedUrl = generatePresignedUrl(fileKey, expirationMinutes);
                presignedUrls.put(fileKey, presignedUrl);
            }
            
            log.info("Pull Request ID {}에 대한 {} 개 파일의 Pre-signed URL 생성 완료", pullRequestId, presignedUrls.size());
            return presignedUrls;
            
        } catch (Exception e) {
            log.error("Pull Request ID {}의 Pre-signed URL 생성 실패: {}", pullRequestId, e.getMessage());
            throw new RuntimeException("Description 음성 파일 URL 생성에 실패했습니다: " + e.getMessage(), e);
        }
    }

    public void cleanupUploadedFiles(List<String> uploadedFileKeys) {
        if (uploadedFileKeys.isEmpty()) {
            return;
        }

        log.info("보상 트랜잭션 시작 - 정리할 파일 수: {}", uploadedFileKeys.size());

        for (String recordKey : uploadedFileKeys) {
            try {
                deleteFile(recordKey); // commentId는 아직 없으므로 null
                log.info("보상 트랜잭션 - 파일 정리 완료: {}", recordKey);
            } catch (Exception cleanupException) {
                log.error("보상 트랜잭션 - 파일 정리 실패: {}, 오류: {}",
                        recordKey, cleanupException.getMessage());
                // 정리 실패는 로그만 남기고 계속 진행 (운영팀이 수동으로 정리할 수 있도록)
            }
        }
    }

}
