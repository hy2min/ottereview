package com.ssafy.ottereview.s3.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.ObjectIdentifier;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.S3Object;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3ServiceImpl implements S3Service {

    private final S3Client s3Client;

    @Value("${cloud.aws.S3.bucket}")
    private String bucketName;

    @Value("${cloud.aws.region.static}")
    private String region;

    @Override
    public String uploadFile(MultipartFile file, Long pullRequestId) {
        try {
            String fileName = String.format("%s%s", System.currentTimeMillis(),
                    file.getOriginalFilename());
            String fileKey = String.format("voice-comments/pr_%d/%s", pullRequestId, fileName);

            Map<String, String> metadata = new HashMap<>();
            metadata.put("fileKey", fileKey);
            metadata.put("fileName", fileName);
            metadata.put("prId", pullRequestId.toString());

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
            log.error("음성 파일 업로드 실패 - PR: {}, File: {}", pullRequestId, file.getOriginalFilename(),
                    e);
            throw new RuntimeException("음성 파일 업로드 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFiles(String fileUrl, Long pullRequestId) {
        try {
            String prefix = String.format("voice-comments/pr_%d/", pullRequestId);

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
    public void deleteFile(String fileKey, Long reviewId) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileKey)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("S3에서 파일 삭제 완료 - Key: {}, PR ID: {}", fileKey, reviewId);

        } catch (S3Exception e) {
            log.error("S3 파일 삭제 실패 - Key: {}, Error: {}", fileKey, e.getMessage());
            throw new RuntimeException("파일 삭제에 실패했습니다: " + e.getMessage());
        } catch (Exception e) {
            log.error("파일 삭제 중 예기치 못한 오류 발생 - Key: {}", fileKey, e);
            throw new RuntimeException("파일 삭제 중 오류가 발생했습니다.");
        }
    }

    @Override
    public List<S3Object> listVoiceFilesByRepository(Long pullRequestId) {
        try {
            String prefix = String.format("voice-comments/pr_%d/", pullRequestId);
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
    public void cleanupUploadedFiles(List<String> uploadedFileKeys) {
        if (uploadedFileKeys.isEmpty()) {
            return;
        }

        log.info("보상 트랜잭션 시작 - 정리할 파일 수: {}", uploadedFileKeys.size());

        for (String recordKey : uploadedFileKeys) {
            try {
                deleteFile(recordKey, null); // commentId는 아직 없으므로 null
                log.info("보상 트랜잭션 - 파일 정리 완료: {}", recordKey);
            } catch (Exception cleanupException) {
                log.error("보상 트랜잭션 - 파일 정리 실패: {}, 오류: {}",
                        recordKey, cleanupException.getMessage());
                // 정리 실패는 로그만 남기고 계속 진행 (운영팀이 수동으로 정리할 수 있도록)
            }
        }
    }

}
