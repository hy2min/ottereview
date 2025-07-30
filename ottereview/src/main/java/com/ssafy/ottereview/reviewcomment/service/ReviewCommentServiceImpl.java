package com.ssafy.ottereview.reviewcomment.service;

import com.ssafy.ottereview.review.entity.Review;
import com.ssafy.ottereview.review.repository.ReviewRepository;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentCreateRequest;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentResponse;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentUpdateRequest;
import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
import com.ssafy.ottereview.reviewcomment.repository.ReviewCommentRepository;
import com.ssafy.ottereview.s3.service.S3ServiceImpl;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RequiredArgsConstructor
@Service
@Transactional
public class ReviewCommentServiceImpl implements ReviewCommentService {

    private final ReviewCommentRepository reviewCommentRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final S3ServiceImpl s3Service;

    @Override
    public List<ReviewCommentResponse> createComments(Long reviewId,
            ReviewCommentCreateRequest reviewCommentCreateRequest, MultipartFile[] files,
            Long userId) {

        List<String> uploadedFileKeys = new ArrayList<>(); // 보상 트랜잭션을 위한 업로드된 파일 키 추적

        try {
            log.info("댓글 일괄 작성 시작 - Review: {}, User: {}, 댓글 수: {}, 파일 수: {}",
                    reviewId, userId, reviewCommentCreateRequest.getComments().size(),
                    files != null ? files.length : 0);

            // 엔티티 조회
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

            Review review = reviewRepository.findById(reviewId)
                    .orElseThrow(
                            () -> new IllegalArgumentException("Review not found: " + reviewId));

            List<ReviewComment> comments = new ArrayList<>();

            // 1단계: 모든 파일을 먼저 업로드하고 추적
            for (ReviewCommentCreateRequest.CommentItem commentItem : reviewCommentCreateRequest.getComments()) {
                String finalBody = commentItem.getBody();
                String recordKey = null;

                // 해당 댓글에 파일이 있는지 확인
                if (commentItem.getFileIndex() != null && files != null &&
                        commentItem.getFileIndex() < files.length) {

                    MultipartFile file = files[commentItem.getFileIndex()];

                    if (file != null && !file.isEmpty()) {
                        try {
                            log.info("댓글 {} 음성 파일 처리 시작 - File: {}",
                                    commentItem.getPath(), file.getOriginalFilename());

                            // AI 음성 처리 (각 파일별로 개별 처리)
                            finalBody = "ai음성 처리 완료";

                            // S3 파일 업로드 (각 댓글별 고유 키)
                            recordKey = s3Service.uploadFile(file, reviewId);
                            uploadedFileKeys.add(recordKey); // 업로드 성공한 파일 키 추적

                            log.info("댓글 {} 음성 파일 처리 완료 - RecordKey: {}",
                                    commentItem.getPath(), recordKey);
                        } catch (Exception fileUploadException) {
                            log.error("파일 업로드 실패 - 댓글: {}, 파일: {}, 오류: {}",
                                    commentItem.getPath(), file.getOriginalFilename(),
                                    fileUploadException.getMessage());

                            // 이미 업로드된 파일들 정리
                            s3Service.cleanupUploadedFiles(uploadedFileKeys);
                            throw new RuntimeException(
                                    "파일 업로드에 실패했습니다: " + fileUploadException.getMessage(),
                                    fileUploadException);
                        }
                    }
                }

                ReviewComment comment = ReviewComment.builder()
                        .user(user)
                        .review(review)
                        .path(commentItem.getPath())
                        .body(finalBody)
                        .recordKey(recordKey)
                        .position(commentItem.getPosition())
                        .githubCreatedAt(LocalDateTime.now())
                        .githubUpdatedAt(LocalDateTime.now())
                        .build();

                comments.add(comment);
            }

            // 2단계: 모든 파일 업로드가 성공한 후 DB에 일괄 저장
            try {
                List<ReviewComment> savedComments = reviewCommentRepository.saveAll(comments);
                log.info("댓글 일괄 작성 완료 - 생성된 댓글 수: {}", savedComments.size());

                return savedComments.stream()
                        .map(ReviewCommentResponse::from)
                        .collect(Collectors.toList());

            } catch (Exception dbException) {
                log.error("DB 저장 실패 - 업로드된 파일 정리 시작: {}", dbException.getMessage());

                // DB 저장 실패 시 업로드된 모든 파일 정리
                s3Service.cleanupUploadedFiles(uploadedFileKeys);
                throw new RuntimeException("댓글 DB 저장에 실패했습니다: " + dbException.getMessage(),
                        dbException);
            }

        } catch (Exception e) {
            log.error("댓글 일괄 작성 중 오류 발생: {}", e.getMessage());
            // 예상치 못한 오류 시에도 파일 정리
            if (!uploadedFileKeys.isEmpty()) {
                s3Service.cleanupUploadedFiles(uploadedFileKeys);
            }
            throw new RuntimeException("댓글 일괄 작성에 실패했습니다.", e);
        }
    }


    @Override
    public ReviewCommentResponse updateComment(Long commentId,
            ReviewCommentUpdateRequest commentUpdateRequest, Long userId, MultipartFile file) {
        ReviewComment existingComment = reviewCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));

        // 작성자 검증
        if (!existingComment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 댓글만 수정할 수 있습니다.");
        }

        String newBody = existingComment.getBody();
        String newRecordKey = existingComment.getRecordKey();
        String oldRecordKey = existingComment.getRecordKey(); // 롤백용 백업

        // 파일이 있으면 파일 처리, 없으면 텍스트만 처리
        if (file != null && !file.isEmpty()) {
            try {
                // 1단계: 새 파일 먼저 업로드
                log.info("댓글 수정 - 새 파일 업로드 시작: CommentId: {}, File: {}",
                        commentId, file.getOriginalFilename());

                newRecordKey = s3Service.uploadFile(file, commentId);
                newBody = "ai번역 로직 수행 완료";  // aiService.convertWithWhisper(file);

                log.info("댓글 수정 - 새 파일 업로드 완료: CommentId: {}, NewRecordKey: {}",
                        commentId, newRecordKey);

                // 2단계: DB 업데이트 시도
                ReviewComment updatedComment = ReviewComment.builder()
                        .id(existingComment.getId())
                        .user(existingComment.getUser())
                        .review(existingComment.getReview())
                        .path(existingComment.getPath())
                        .body(newBody)
                        .recordKey(newRecordKey)
                        .position(existingComment.getPosition())
                        .githubCreatedAt(existingComment.getGithubCreatedAt())
                        .githubUpdatedAt(LocalDateTime.now())
                        .build();

                try {
                    reviewCommentRepository.save(updatedComment);
                    log.info("댓글 수정 - DB 업데이트 완료: CommentId: {}", commentId);

                    // 3단계: DB 업데이트 성공 후 기존 파일 삭제
                    if (oldRecordKey != null && !oldRecordKey.isEmpty() && !oldRecordKey.equals(
                            newRecordKey)) {
                        try {
                            s3Service.deleteFile(oldRecordKey, commentId);
                            log.info("댓글 수정 - 기존 파일 삭제 완료: CommentId: {}, OldRecordKey: {}",
                                    commentId, oldRecordKey);
                        } catch (Exception oldFileDeleteException) {
                            // 기존 파일 삭제 실패는 로그만 남기고 계속 진행 (데이터 정합성에는 영향 없음)
                            log.error(
                                    "댓글 수정 - 기존 파일 삭제 실패 (데이터 정합성 유지됨): CommentId: {}, OldRecordKey: {}, 오류: {}",
                                    commentId, oldRecordKey, oldFileDeleteException.getMessage());
                        }
                    }

                    return ReviewCommentResponse.from(updatedComment);

                } catch (Exception dbException) {
                    log.error("댓글 수정 - DB 업데이트 실패, 새 파일 정리 시작: CommentId: {}, 오류: {}",
                            commentId, dbException.getMessage());

                    // DB 업데이트 실패 시 새로 업로드한 파일 정리
                    try {
                        s3Service.deleteFile(newRecordKey, commentId);
                        log.info("댓글 수정 - 보상 트랜잭션 완료: 새 파일 정리됨: {}", newRecordKey);
                    } catch (Exception cleanupException) {
                        log.error("댓글 수정 - 보상 트랜잭션 실패: 새 파일 정리 실패: {}, 오류: {}",
                                newRecordKey, cleanupException.getMessage());
                    }

                    throw new RuntimeException(
                            "댓글 수정 중 DB 업데이트에 실패했습니다: " + dbException.getMessage(), dbException);
                }

            } catch (Exception fileUploadException) {
                log.error("댓글 수정 - 파일 업로드 실패: CommentId: {}, 오류: {}",
                        commentId, fileUploadException.getMessage());
                throw new RuntimeException(
                        "댓글 수정 중 파일 업로드에 실패했습니다: " + fileUploadException.getMessage(),
                        fileUploadException);
            }

        } else if (commentUpdateRequest.getBody() != null) {
            // 텍스트만 수정 (파일 변경 없음)
            newBody = commentUpdateRequest.getBody();

            ReviewComment updatedComment = ReviewComment.builder()
                    .id(existingComment.getId())
                    .user(existingComment.getUser())
                    .review(existingComment.getReview())
                    .path(existingComment.getPath())
                    .body(newBody)
                    .recordKey(newRecordKey) // 기존 recordKey 유지
                    .position(existingComment.getPosition())
                    .githubCreatedAt(existingComment.getGithubCreatedAt())
                    .githubUpdatedAt(LocalDateTime.now())
                    .build();

            reviewCommentRepository.save(updatedComment);
            return ReviewCommentResponse.from(updatedComment);
        } else {
            // 변경사항 없음
            return ReviewCommentResponse.from(existingComment);
        }
    }

    @Override
    public void deleteComment(Long commentId, Long userId) {
        ReviewComment comment = reviewCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));

        // 작성자 검증
        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 댓글만 삭제할 수 있습니다.");
        }

        String recordKey = comment.getRecordKey();

        // 1단계: S3 파일 먼저 삭제 (외부 리소스 우선 정리)
        if (recordKey != null && !recordKey.isEmpty()) {
            try {
                s3Service.deleteFile(recordKey, commentId);
                log.info("S3 파일 삭제 완료 - CommentId: {}, RecordKey: {}", commentId, recordKey);
            } catch (Exception s3Exception) {
                log.error("S3 파일 삭제 실패 - CommentId: {}, RecordKey: {}, 오류: {}",
                        commentId, recordKey, s3Exception.getMessage());

                // S3 파일 삭제 실패 시 DB 삭제를 중단하여 데이터 정합성 유지
                // 추후 배치 작업으로 재시도할 수 있도록 DB 레코드 보존
                throw new RuntimeException(
                        "파일 삭제에 실패했습니다. 관리자에게 문의하세요: " + s3Exception.getMessage(), s3Exception);
            }
        }

        // 2단계: S3 파일 삭제가 성공한 후 DB 레코드 삭제
        try {
            reviewCommentRepository.deleteById(commentId);
            log.info("댓글 삭제 완료 - CommentId: {}", commentId);
        } catch (Exception dbException) {
            log.error("DB 댓글 삭제 실패 - CommentId: {}, 오류: {}", commentId, dbException.getMessage());

            // DB 삭제 실패 시 이미 삭제된 S3 파일은 복구할 수 없으므로
            // 관리자가 확인할 수 있도록 상세한 로그 남김
            log.error("주의: S3 파일은 이미 삭제되었지만 DB 레코드 삭제 실패 - CommentId: {}, RecordKey: {}",
                    commentId, recordKey);

            throw new RuntimeException("댓글 DB 삭제에 실패했습니다: " + dbException.getMessage(),
                    dbException);
        }
    }

    @Override
    public List<ReviewCommentResponse> getCommentsByReviewId(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        List<ReviewComment> comments = reviewCommentRepository.findAllByReview(review);
        return comments.stream()
                .map(ReviewCommentResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public ReviewCommentResponse getCommentById(Long commentId) {
        ReviewComment comment = reviewCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        return ReviewCommentResponse.from(comment);
    }

    @Override
    public List<ReviewCommentResponse> getCommentsByUserId(Long userId) {
        List<ReviewComment> comments = reviewCommentRepository.findAllByUserId(userId);
        return comments.stream()
                .map(ReviewCommentResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<ReviewCommentResponse> getCommentsByReviewIdAndPath(Long reviewId, String path) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        List<ReviewComment> comments = reviewCommentRepository.findAllByReviewAndPath(review, path);
        return comments.stream()
                .map(ReviewCommentResponse::from)
                .collect(Collectors.toList());
    }
}