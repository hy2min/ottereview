package com.ssafy.ottereview.reviewcomment.service;

import com.ssafy.ottereview.account.repository.AccountRepository;
import com.ssafy.ottereview.ai.service.AiAudioProcessingService;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.review.entity.Review;
import com.ssafy.ottereview.review.exception.ReviewErrorCode;
import com.ssafy.ottereview.review.repository.ReviewRepository;
import com.ssafy.ottereview.review.service.ReviewGithubService;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentCreateRequest;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentResponse;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentUpdateRequest;
import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
import com.ssafy.ottereview.reviewcomment.exception.ReviewCommentErrorCode;
import com.ssafy.ottereview.reviewcomment.repository.ReviewCommentRepository;
import com.ssafy.ottereview.s3.service.S3ServiceImpl;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.exception.UserErrorCode;
import com.ssafy.ottereview.user.repository.UserRepository;
import java.time.Duration;
import java.util.Collections;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@RequiredArgsConstructor
@Service
public class ReviewCommentServiceImpl implements ReviewCommentService {

    private final ReviewCommentRepository reviewCommentRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewGithubService reviewGithubService;
    private final AccountRepository accountRepository;
    private final S3ServiceImpl s3Service;
    private final AiAudioProcessingService aiAudioProcessingService;

    @Override
    @Transactional
    public List<ReviewCommentResponse> createComments(Long reviewId,
            ReviewCommentCreateRequest reviewCommentCreateRequest,
            MultipartFile[] files,
            Long userId) {

        log.info("댓글 일괄 작성 시작 - Review: {}, User: {}, 댓글 수: {}, 파일 수: {}",
                reviewId, userId, reviewCommentCreateRequest.getComments().size(),
                files != null ? files.length : 0);

        List<String> uploadedFileKeys = Collections.synchronizedList(new ArrayList<>());

        try {
            // 엔티티 조회
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new BusinessException(UserErrorCode.USER_NOT_FOUND));
            Review review = reviewRepository.findById(reviewId)
                    .orElseThrow(() -> new BusinessException(ReviewErrorCode.REVIEW_NOT_FOUND));

            // 모든 댓글을 병렬로 처리 후 .block()으로 결과 기다림
            List<ReviewComment> comments = Flux.fromIterable(reviewCommentCreateRequest.getComments())
                    .flatMap(commentItem -> {
                        // 파일이 있으면 AI 처리 + S3 업로드, 없으면 바로 댓글 생성
                        if (commentItem.getFileIndex() != null && files != null &&
                                commentItem.getFileIndex() < files.length) {

                            MultipartFile file = files[commentItem.getFileIndex()];
                            if (file != null && !file.isEmpty()) {
                                // AI 처리와 S3 업로드를 병렬로
                                Mono<String> aiProcessing = aiAudioProcessingService.processAudioFile(file);
                                Mono<String> s3Upload = Mono.fromCallable(() -> {
                                    String key = s3Service.uploadFile(file, reviewId);
                                    uploadedFileKeys.add(key);
                                    return key;
                                }).subscribeOn(Schedulers.boundedElastic());

                                return Mono.zip(aiProcessing, s3Upload)
                                        .map(tuple -> ReviewComment.builder()
                                                .user(user)
                                                .review(review)
                                                .path(commentItem.getPath())
                                                .body(tuple.getT1()) // AI 처리된 텍스트
                                                .recordKey(tuple.getT2()) // S3 키
                                                .position(commentItem.getPosition())
                                                .line(commentItem.getLine())
                                                .startLine(commentItem.getStartLine())
                                                .startSide(commentItem.getStartSide())
                                                .side(commentItem.getSide())
                                                .githubCreatedAt(LocalDateTime.now())
                                                .githubUpdatedAt(LocalDateTime.now())
                                                .build());
                            }
                        }

                        // 파일이 없는 경우 바로 댓글 생성
                        return Mono.just(ReviewComment.builder()
                                .user(user)
                                .review(review)
                                .path(commentItem.getPath())
                                .body(commentItem.getBody())
                                .recordKey(null)
                                .position(commentItem.getPosition())
                                .line(commentItem.getLine())
                                .startLine(commentItem.getStartLine())
                                .startSide(commentItem.getStartSide())
                                .side(commentItem.getSide())
                                .githubCreatedAt(LocalDateTime.now())
                                .githubUpdatedAt(LocalDateTime.now())
                                .build());
                    }, 5) // 최대 5개 동시 처리
                    .collectList()
                    .block(Duration.ofMinutes(10)); // 최대 10분 대기

            // DB 저장
            List<ReviewComment> savedComments = reviewCommentRepository.saveAll(comments);
            log.info("댓글 일괄 작성 완료 - 생성된 댓글 수: {}", savedComments.size());

            return savedComments.stream()
                    .map(ReviewCommentResponse::from)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("댓글 일괄 작성 중 오류 발생: {}", e.getMessage());
            // 에러 시 업로드된 파일 정리
            if (!uploadedFileKeys.isEmpty()) {
                s3Service.cleanupUploadedFiles(uploadedFileKeys);
            }
            throw new BusinessException(ReviewCommentErrorCode.REVIEW_COMMENT_CREATE_FAILED);
        }
    }


    @Override
    @Transactional
    public ReviewCommentResponse updateComment(Long commentId,
                                               ReviewCommentUpdateRequest commentUpdateRequest, Long userId, MultipartFile file) {
        ReviewComment existingComment = reviewCommentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ReviewCommentErrorCode.REVIEW_COMMENT_NOT_FOUND));

        // 작성자 검증
        if (!existingComment.getUser().getId().equals(userId)) {
            throw new BusinessException(
                    ReviewCommentErrorCode.REVIEW_COMMENT_NOT_AUTHORIZED);
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
                newBody = aiAudioProcessingService.processAudioFile(file).block();  // aiService.convertWithWhisper(file);

                log.info("댓글 수정 - 새 파일 업로드 완료: CommentId: {}, NewRecordKey: {}",
                        commentId, newRecordKey);

                // 2단계: DB 업데이트 시도
                ReviewComment updatedComment = ReviewComment.builder()
                        .id(existingComment.getId())
                        .user(existingComment.getUser())
                        .githubId(existingComment.getGithubId())
                        .review(existingComment.getReview())
                        .path(existingComment.getPath())
                        .side(existingComment.getSide())
                        .diffHunk(existingComment.getDiffHunk())
                        .body(newBody)
                        .line(existingComment.getLine())
                        .startLine(existingComment.getStartLine())
                        .startLine(existingComment.getStartLine())
                        .recordKey(newRecordKey)
                        .position(existingComment.getPosition())
                        .githubCreatedAt(existingComment.getGithubCreatedAt())
                        .githubUpdatedAt(LocalDateTime.now())
                        .build();

                try {
                    reviewCommentRepository.save(updatedComment);
                    log.info("댓글 수정 - DB 업데이트 완료: CommentId: {}", commentId);

                    // GitHub API 호출
                    githubUpdateComment(updatedComment, newBody);

                    // 3단계: DB 업데이트 성공 후 기존 파일 삭제
                    if (oldRecordKey != null && !oldRecordKey.isEmpty() && !oldRecordKey.equals(
                            newRecordKey)) {
                        try {
                            s3Service.deleteFile(oldRecordKey);
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
                        s3Service.deleteFile(newRecordKey);
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
                    .githubId(existingComment.getGithubId())
                    .path(existingComment.getPath())
                    .body(newBody)
                    .recordKey(newRecordKey) // 기존 recordKey 유지
                    .position(existingComment.getPosition())
                    .startLine(existingComment.getStartLine())
                    .line(existingComment.getLine())
                    .side(existingComment.getSide())
                    .startSide(existingComment.getStartSide())
                    .diffHunk(existingComment.getDiffHunk())
                    .githubCreatedAt(existingComment.getGithubCreatedAt())
                    .githubUpdatedAt(LocalDateTime.now())
                    .build();

            reviewCommentRepository.save(updatedComment);

            // 깃허브 동기화
            githubUpdateComment(updatedComment, newBody);
            return ReviewCommentResponse.from(updatedComment);
        } else {
            // 변경사항 없음
            return ReviewCommentResponse.from(existingComment);
        }
    }

    private void githubUpdateComment(ReviewComment comment, String newBody) {
        try {
            String repoFullName = comment.getReview().getPullRequest().getRepo().getFullName();
            Long accountId = comment.getReview().getPullRequest().getRepo().getAccount().getId();

            Long installationId = accountRepository.findById(accountId)
                    .orElseThrow(() -> new RuntimeException("Account not found"))
                    .getInstallationId();

            reviewGithubService.updateReviewCommentOnGithub(
                    installationId,
                    repoFullName,
                    comment.getGithubId(),
                    newBody,
                    comment.getUser().getGithubUsername()
            );
        } catch (Exception e) {
            log.error("GitHub 코멘트 동기화 실패: commentId={}, message={}", comment.getId(), e.getMessage());
        }
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        ReviewComment comment = reviewCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));

        // 작성자 검증
        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 댓글만 삭제할 수 있습니다.");
        }

        // 외부 리소스 정보는 미리 저장
        String recordKey = comment.getRecordKey();
        Long githubId = comment.getGithubId();
        String repoFullName = comment.getReview().getPullRequest().getRepo().getFullName();
        Long accountId = comment.getReview().getPullRequest().getRepo().getAccount().getId();

        // DB 삭제 (트랜잭션 안에서)
        reviewCommentRepository.deleteById(commentId);
        log.info("댓글 DB 삭제 완료 - CommentId: {}", commentId);

        // 트랜잭션 커밋 이후 외부 리소스 삭제
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    // 1. S3 삭제
                    if (recordKey != null && !recordKey.isEmpty()) {
                        try {
                            s3Service.deleteFile(recordKey);
                            log.info("S3 파일 삭제 완료 - CommentId: {}, RecordKey: {}", commentId, recordKey);
                        } catch (Exception e) {
                            log.error("S3 파일 삭제 실패 - CommentId: {}, RecordKey: {}", commentId, recordKey, e);
                        }
                    }

                    // 2. GitHub 삭제
                    try {
                        Long installationId = accountRepository.findById(accountId)
                                .orElseThrow(() -> new RuntimeException("Account not found"))
                                .getInstallationId();

                        reviewGithubService.deleteReviewCommentOnGithub(installationId, repoFullName, githubId);
                        log.info("GitHub 리뷰 코멘트 삭제 완료 - CommentId: {}, GithubId: {}", commentId, githubId);
                    } catch (Exception e) {
                        log.error("GitHub 리뷰 코멘트 삭제 실패 - GithubId: {}", githubId, e);
                    }
                }
            });
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewCommentResponse> getCommentsByReviewId(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        List<ReviewComment> comments = reviewCommentRepository.findAllByReview(review);
        return comments.stream()
                .map(this::createResponseWithVoiceUrl)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewCommentResponse getCommentById(Long commentId) {
        ReviewComment comment = reviewCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        return createResponseWithVoiceUrl(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewCommentResponse> getCommentsByUserId(Long userId) {
        List<ReviewComment> comments = reviewCommentRepository.findAllByUserId(userId);
        return comments.stream()
                .map(this::createResponseWithVoiceUrl)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewCommentResponse> getCommentsByReviewIdAndPath(Long reviewId, String path) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        List<ReviewComment> comments = reviewCommentRepository.findAllByReviewAndPath(review, path);
        return comments.stream()
                .map(this::createResponseWithVoiceUrl)
                .collect(Collectors.toList());
    }

    /**
     * ReviewComment를 ReviewCommentResponse로 변환하면서 recordKey가 있으면 Pre-signed URL을 생성합니다.
     */
    private ReviewCommentResponse createResponseWithVoiceUrl(ReviewComment comment) {
        ReviewCommentResponse response = ReviewCommentResponse.from(comment);
        
        // recordKey가 있으면 Pre-signed URL 생성
        if (comment.getRecordKey() != null && !comment.getRecordKey().trim().isEmpty()) {
            try {
                String voiceUrl = s3Service.generatePresignedUrl(comment.getRecordKey(), 60); // 60분 유효
                return response.toBuilder()
                        .voiceFileUrl(voiceUrl)
                        .build();
            } catch (Exception e) {
                log.warn("음성 파일 URL 생성 실패 - commentId: {}, recordKey: {}, error: {}", 
                    comment.getId(), comment.getRecordKey(), e.getMessage());
                // URL 생성 실패해도 응답은 반환
            }
        }
        
        return response;
    }
}
