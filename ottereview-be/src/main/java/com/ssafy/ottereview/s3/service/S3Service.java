package com.ssafy.ottereview.s3.service;

import java.util.List;
import java.util.Map;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.model.S3Object;

public interface S3Service {

    /**
     * S3에 파일을 업로드 하는 함수.
     *
     * @param file     S3에 올릴 파일(반드시 영문,숫자)
     * @param reviewId 풀리퀘스트 ID
     * @return
     */
    String uploadFile(MultipartFile file, Long reviewId);

    List<S3Object> listVoiceFilesByReviewId(Long reviewId);

    String uploadDesFile(MultipartFile file, Long descriptionId);

    void deleteFiles(Long reviewId);

    /**
     * Pull Request ID로 description 음성 파일들을 삭제합니다.
     *
     * @param pullRequestId Pull Request ID
     */
    void deleteDescriptionFiles(Long pullRequestId);

    void deleteFile(String fileKey);

    void cleanupUploadedFiles(List<String> uploadedFileKeys);

    /**
     * S3 파일에 대한 임시 접근 URL을 생성합니다.
     *
     * @param fileKey S3 파일 키
     * @param expirationMinutes URL 만료 시간 (분)
     * @return Pre-signed URL
     */
    String generatePresignedUrl(String fileKey, int expirationMinutes);

    /**
     * 리뷰 ID로 음성 파일들의 Pre-signed URL을 생성합니다.
     *
     * @param reviewId 리뷰 ID
     * @param expirationMinutes URL 만료 시간 (분)
     * @return 파일 키와 URL의 매핑
     */
    Map<String, String> generatePresignedUrlsForReview(Long reviewId, int expirationMinutes);

    /**
     * Pull Request ID로 description 음성 파일들을 조회합니다.
     *
     * @param pullRequestId Pull Request ID
     * @return Description에 연결된 S3 파일 목록
     */
    List<S3Object> listVoiceFilesByPullRequestId(Long pullRequestId);

    /**
     * Pull Request ID로 description 음성 파일들의 Pre-signed URL을 생성합니다.
     *
     * @param pullRequestId Pull Request ID
     * @param expirationMinutes URL 만료 시간 (분)
     * @return 파일 키와 URL의 매핑
     */
    Map<String, String> generatePresignedUrlsForPullRequest(Long pullRequestId, int expirationMinutes);
}
