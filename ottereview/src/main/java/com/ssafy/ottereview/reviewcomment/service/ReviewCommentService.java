package com.ssafy.ottereview.reviewcomment.service;

import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentCreateRequest;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentResponse;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentUpdateRequest;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface ReviewCommentService {

    /**
     * 리뷰에 댓글들을 일괄 생성합니다.
     *
     * @param reviewId                   리뷰 ID
     * @param reviewCommentCreateRequest 댓글 생성 요청 DTO (리스트)
     * @param files                      음성 파일 배열 (각 댓글별 개별 파일)
     * @param userId                     작성자 ID
     * @return
     */
    List<ReviewCommentResponse> createComments(Long reviewId,
            ReviewCommentCreateRequest reviewCommentCreateRequest, MultipartFile[] files,
            Long userId);

    /**
     * 리뷰의 모든 댓글을 조회합니다.
     *
     * @param reviewId 리뷰 ID
     * @return 댓글 응답 리스트
     */
    List<ReviewCommentResponse> getCommentsByReviewId(Long reviewId);

    /**
     * 댓글 ID로 특정 댓글을 조회합니다.
     *
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
     * @param file                 음성 파일 (선택적)
     * @return
     */
    ReviewCommentResponse updateComment(Long commentId,
            ReviewCommentUpdateRequest commentUpdateRequest, Long userId, MultipartFile file);

    /**
     * 댓글을 삭제합니다.
     *
     * @param commentId 댓글 ID
     * @param userId    삭제 요청자 ID
     */
    void deleteComment(Long commentId, Long userId);

    /**
     * 사용자의 모든 댓글을 조회합니다.
     *
     * @param userId 사용자 ID
     * @return 댓글 응답 리스트
     */
    List<ReviewCommentResponse> getCommentsByUserId(Long userId);

    /**
     * 특정 리뷰의 특정 파일 경로에 대한 댓글을 조회합니다.
     *
     * @param reviewId 리뷰 ID
     * @param path     파일 경로
     * @return 댓글 응답 리스트
     */
    List<ReviewCommentResponse> getCommentsByReviewIdAndPath(Long reviewId, String path);
}
