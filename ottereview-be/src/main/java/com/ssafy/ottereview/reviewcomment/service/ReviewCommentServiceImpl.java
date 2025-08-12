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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.function.Tuple2;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

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
                                                      ReviewCommentCreateRequest request,
                                                      MultipartFile[] files,
                                                      Long userId) {

        log.info("댓글 일괄 작성 시작 - Review: {}, User: {}, 댓글 수: {}, 파일 수: {}",
                reviewId, userId, request.getComments().size(),
                files != null ? files.length : 0);

        List<String> uploadedFileKeys = Collections.synchronizedList(new ArrayList<>());

        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new BusinessException(UserErrorCode.USER_NOT_FOUND));
            Review review = reviewRepository.findById(reviewId)
                    .orElseThrow(() -> new BusinessException(ReviewErrorCode.REVIEW_NOT_FOUND));

            List<ReviewComment> comments = Flux.fromIterable(request.getComments())
                    .flatMap(item -> createCommentMono(item, files, user, review, uploadedFileKeys), 5)
                    .collectList()
                    .block(Duration.ofMinutes(10));

            List<ReviewComment> savedComments = reviewCommentRepository.saveAll(comments);

            log.info("댓글 일괄 작성 완료 - 생성된 댓글 수: {}", savedComments.size());

            return savedComments.stream()
                    .map(ReviewCommentResponse::from)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("댓글 일괄 작성 중 오류 발생", e);
            cleanupUploadedFiles(uploadedFileKeys);
            throw new BusinessException(ReviewCommentErrorCode.REVIEW_COMMENT_CREATE_FAILED);
        }
    }

    private boolean hasFile(ReviewCommentCreateRequest.CommentItem item, MultipartFile[] files) {
        return item.getFileIndex() != null &&
                files != null &&
                item.getFileIndex() < files.length &&
                files[item.getFileIndex()] != null &&
                !files[item.getFileIndex()].isEmpty();
    }

    private Mono<ReviewComment> createCommentMono(ReviewCommentCreateRequest.CommentItem item,
                                                  MultipartFile[] files,
                                                  User user,
                                                  Review review,
                                                  List<String> uploadedFileKeys) {
        if (hasFile(item, files)) {
            MultipartFile file = files[item.getFileIndex()];
            return processFile(file, review.getId(), uploadedFileKeys)
                    .map(tuple -> buildComment(item, user, review, tuple.getT1(), tuple.getT2()));
        } else {
            return Mono.just(buildComment(item, user, review, item.getBody(), null));
        }
    }

    private Mono<Tuple2<String, String>> processFile(MultipartFile file,
                                                     Long referenceId,
                                                     List<String> uploadedFileKeys) {
        Mono<String> aiProcessing = aiAudioProcessingService.processAudioFile(file);
        Mono<String> s3Upload = Mono.fromCallable(() -> {
            String key = s3Service.uploadFile(file, referenceId);
            uploadedFileKeys.add(key);
            return key;
        }).subscribeOn(Schedulers.boundedElastic());

        return Mono.zip(aiProcessing, s3Upload);
    }

    private ReviewComment buildComment(ReviewCommentCreateRequest.CommentItem item,
                                       User user,
                                       Review review,
                                       String body,
                                       String recordKey) {
        return ReviewComment.builder()
                .user(user)
                .review(review)
                .path(item.getPath())
                .body(body)
                .recordKey(recordKey)
                .position(item.getPosition())
                .line(item.getLine())
                .startLine(item.getStartLine())
                .startSide(item.getStartSide())
                .side(item.getSide())
                .githubCreatedAt(LocalDateTime.now())
                .githubUpdatedAt(LocalDateTime.now())
                .build();
    }

    private void cleanupUploadedFiles(List<String> uploadedFileKeys) {
        if (!uploadedFileKeys.isEmpty()) {
            s3Service.cleanupUploadedFiles(uploadedFileKeys);
        }
    }

    @Override
    @Transactional
    public ReviewCommentResponse updateComment(Long commentId,
                                               ReviewCommentUpdateRequest commentUpdateRequest, Long userId, MultipartFile file) {
        ReviewComment existingComment = reviewCommentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ReviewCommentErrorCode.REVIEW_COMMENT_NOT_FOUND));

        if (!existingComment.getUser().getId().equals(userId)) {
            throw new BusinessException(ReviewCommentErrorCode.REVIEW_COMMENT_NOT_AUTHORIZED);
        }

        String oldRecordKey = existingComment.getRecordKey();
        List<String> uploadedFileKeys = Collections.synchronizedList(new ArrayList<>());

        try {
            Mono<ReviewComment> commentMono;

            // 파일이 있으면 processFile → buildComment
            if (file != null && !file.isEmpty()) {
                commentMono = processFile(file, commentId, uploadedFileKeys)
                        .map(tuple -> buildComment(
                                        ReviewCommentCreateRequest.CommentItem.builder()
                                                .path(existingComment.getPath())
                                                .position(existingComment.getPosition())
                                                .line(existingComment.getLine())
                                                .startLine(existingComment.getStartLine())
                                                .startSide(existingComment.getStartSide())
                                                .side(existingComment.getSide())
                                                .body(tuple.getT1())
                                                .build(),
                                        existingComment.getUser(),
                                        existingComment.getReview(),
                                        tuple.getT1(),
                                        tuple.getT2()
                                ).toBuilder()
                                        .id(existingComment.getId())
                                        .githubId(existingComment.getGithubId())
                                        .diffHunk(existingComment.getDiffHunk())
                                        .githubCreatedAt(existingComment.getGithubCreatedAt())
                                        .githubUpdatedAt(LocalDateTime.now())
                                        .build()
                        );
            } else {
                // 텍스트만 수정
                String body = commentUpdateRequest.getBody() != null
                        ? commentUpdateRequest.getBody()
                        : existingComment.getBody();

                commentMono = Mono.just(
                        existingComment.toBuilder()
                                .body(body)
                                .githubUpdatedAt(LocalDateTime.now())
                                .build()
                );
            }

            ReviewComment updated = commentMono.block(Duration.ofMinutes(2));
            reviewCommentRepository.save(updated);

            // GitHub 동기화
            githubUpdateComment(updated, updated.getBody());

            // 기존 파일 삭제 (변경 시)
            if (file != null && !file.isEmpty()
                    && oldRecordKey != null
                    && !oldRecordKey.equals(updated.getRecordKey())) {
                s3Service.deleteFile(oldRecordKey);
            }

            return ReviewCommentResponse.from(updated);

        } catch (Exception e) {
            cleanupUploadedFiles(uploadedFileKeys);
            throw new BusinessException(ReviewCommentErrorCode.REVIEW_COMMENT_UPDATE_FAILED);
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
