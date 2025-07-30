package com.ssafy.ottereview.s3.service;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.model.S3Object;

public interface S3Service {

    /**
     * S3에 파일을 업로드 하는 함수.
     *
     * @param file          S3에 올릴 파일(반드시 영문,숫자)
     * @param reviewId 풀리퀘스트 ID
     * @return
     */
    String uploadFile(MultipartFile file, Long reviewId);

    List<S3Object> listVoiceFilesByReviewId(Long reviewId);

    void deleteFiles(Long reviewId);

    void deleteFile(String fileKey);

    void cleanupUploadedFiles(List<String> uploadedFileKeys);
}
