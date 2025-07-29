package com.ssafy.ottereview.reviewcomment.service;

import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentCreateRequest;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentResponse;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentUpdateRequest;
import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface ReviewCommentService {
    
    /**
     * 풀리퀘스트에 댓글을 생성합니다.
     *
     * @param pullRequestId        풀리퀘스트 ID
     * @param reviewCommentCreateRequest 댓글 생성 요청 DTO
     * @param file                 음성 파일 (선택적)
     * @param userId               작성자 ID
     * @return
     */
    ReviewCommentResponse createComment(Long pullRequestId, ReviewCommentCreateRequest reviewCommentCreateRequest, MultipartFile file, Long userId);

    /**
     * 풀리퀘스트의 모든 댓글을 조회합니다.
     * @param pullRequestId 풀리퀘스트 ID
     * @return 댓글 응답 리스트
     */
    List<ReviewCommentResponse> getCommentsByPullRequestId(Long pullRequestId);

    /**
     * 댓글 ID로 특정 댓글을 조회합니다.
     * @param commentId 댓글 ID
     * @return 댓글 응답
     */
    ReviewCommentResponse getCommentById(Long commentId);

    /**
     * 댓글을 수정합니다.
     *
     * @param commentId            댓글 ID
     * @param commentUpdateRequest 댓글 수정 요청 DTO
     * @param userId               수정 요청자 ID
     * @return
     */


    /**
     * 댓글을 삭제합니다.
     * @param commentId 댓글 ID
     * @param userId 삭제 요청자 ID
     */
    void deleteComment(Long commentId, Long userId);

    ReviewCommentResponse updateComment(Long commentId, ReviewCommentUpdateRequest request, Long id,MultipartFile file);
}
