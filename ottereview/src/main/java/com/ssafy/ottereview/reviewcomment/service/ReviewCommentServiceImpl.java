package com.ssafy.ottereview.reviewcomment.service;

import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentCreateRequest;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentResponse;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentUpdateRequest;
import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
import com.ssafy.ottereview.reviewcomment.repository.ReviewCommentRepository;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.s3.service.S3ServiceImpl;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import jakarta.transaction.Transactional;
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
    private final PullRequestRepository pullRequestRepository;
    private final UserRepository userRepository;
    private final S3ServiceImpl s3Service;

    @Override
    public ReviewCommentResponse createComment(Long pullRequestId, ReviewCommentCreateRequest reviewCommentCreateRequest, MultipartFile file, Long userId) {
        try {
            log.info("댓글 작성 시작 - PR: {}, User: {}, Line: {}",
                    pullRequestId, userId, reviewCommentCreateRequest.getLineNumber());
            
            // 당소 엔티티 조회
            PullRequest pullRequest = pullRequestRepository.findById(pullRequestId)
                    .orElseThrow(() -> new IllegalArgumentException("Pull Request not found: " + pullRequestId));
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
            
            String content = reviewCommentCreateRequest.getContent();
            String s3FileKey = null;
            
            // 음성 파일 처리
            if (file != null && !file.isEmpty()) {
                log.info("음성 파일 처리 시작 - File: {}", file.getOriginalFilename());
                
                // AI 음성 처리 (임시)
                content = "ai음성 처리 완료: " + content;
                
                // S3 파일 업로드
                s3FileKey = s3Service.uploadFile(file, pullRequestId);
            }
            
            // Comment 엔티티 생성
            ReviewComment comment = new ReviewComment(
                    null,
                    pullRequest,
                    user,
                    reviewCommentCreateRequest.getCommitSha(),
                    reviewCommentCreateRequest.getFilePath(),
                    reviewCommentCreateRequest.getLineNumber(),
                    content,
                    s3FileKey
            );
            
            reviewCommentRepository.save(comment);
            log.info("댓글 작성 완료 - Comment ID: {}", comment.getId());
            return ReviewCommentResponse.from(comment);
        } catch (Exception e) {
            log.error("댓글 작성 중 오류 발생: {}", e.getMessage());
            throw new RuntimeException("댓글 작성에 실패했습니다.", e);
        }

    }

    @Override
    public ReviewCommentResponse updateComment(Long commentId, ReviewCommentUpdateRequest commentUpdateRequest, Long userId, MultipartFile file) {
        ReviewComment comment = reviewCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));

        // 작성자 검증
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 댓글만 수정할 수 있습니다.");
        }

        // 파일이 있으면 파일 처리, 없으면 텍스트만 처리
        if (file != null && !file.isEmpty()) {
            // 파일 업로드 처리
            String content = "ai번역 로직 수행 완료";  // aiService.convertWithWhisper(file);
            comment.setContent(content);

            // 기존 파일 삭제
            String s3FileKey = comment.getRecord_key();
            if (s3FileKey != null) {
                s3Service.deleteFile(s3FileKey, commentId);
            }

            // 새 파일 업로드
            String newFileKey = s3Service.uploadFile(file, commentId);
            comment.setRecord_key(newFileKey);

        } else {
            // 텍스트만 수정
            comment.setContent(commentUpdateRequest.getContent());
        }

        reviewCommentRepository.save(comment);
        return ReviewCommentResponse.from(comment);
    }

    @Override
    public void deleteComment(Long commentId, Long userId) {
        ReviewComment comment = reviewCommentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        
        // 작성자 반 검증
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 댓글만 삭제할 수 있습니다.");
        }

        //파일 삭제
        if(!comment.getRecord_key().isEmpty()) {
            s3Service.deleteFile(comment.getRecord_key(), commentId);
        }

        reviewCommentRepository.deleteById(commentId);
    }


    @Override
    public List<ReviewCommentResponse> getCommentsByPullRequestId(Long pullRequestId) {
        List<ReviewComment> comments = reviewCommentRepository.findAllByPullRequestId(pullRequestId);
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

}
