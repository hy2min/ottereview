package com.ssafy.ottereview.reviewcomment.controller;

import com.ssafy.ottereview.common.annotation.MvcController;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentReplyRequest;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentResponse;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentUpdateRequest;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentWithRepliesResponse;
import com.ssafy.ottereview.reviewcomment.service.ReviewCommentService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/reviews/{review-id}/comments")
@RequiredArgsConstructor
@Slf4j
@MvcController
public class ReviewCommentController {

    private final ReviewCommentService reviewCommentService;

    @GetMapping
    public ResponseEntity<?> getCommentsByReview(
            @PathVariable("review-id") Long reviewId) {

        List<ReviewCommentResponse> comments = reviewCommentService.getCommentsByReviewId(reviewId);
        return ResponseEntity.ok(comments);
    }


    @PutMapping("/{comment-id}")
    public ResponseEntity<?> updateComment(
            @PathVariable("review-id") Long reviewId,
            @PathVariable("comment-id") Long commentId,
            @RequestPart ReviewCommentUpdateRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal CustomUserDetail userDetail) {


        ReviewCommentResponse comment = reviewCommentService.updateComment(commentId, request,
                userDetail.getUser().getId(), file);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/{comment-id}")
    public ResponseEntity<String> deleteComment(
            @PathVariable("review-id") Long reviewId,
            @PathVariable("comment-id") Long commentId,
            @AuthenticationPrincipal CustomUserDetail userDetail) {

        reviewCommentService.deleteComment(commentId, userDetail.getUser().getId());
        return ResponseEntity.ok("댓글이 성공적으로 삭제되었습니다.");
    }

    @GetMapping("/users/{user-id}")
    public ResponseEntity<?> getCommentsByUser(
            @PathVariable("user-id") Long userId) {

        List<ReviewCommentResponse> comments = reviewCommentService.getCommentsByUserId(userId);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/path")
    public ResponseEntity<?> getCommentsByPath(
            @PathVariable("review-id") Long reviewId,
            @RequestParam("path") String path) {

        List<ReviewCommentResponse> comments = reviewCommentService.getCommentsByReviewIdAndPath(
                reviewId, path);
        return ResponseEntity.ok(comments);
    }

    /**
     * 클로드 코드
     */


    /**
     * 답글 생성
     */
    @PostMapping("/replies")
    public ResponseEntity<?> createReply(
            @RequestBody ReviewCommentReplyRequest request,
            @AuthenticationPrincipal CustomUserDetail userDetail) {

        ReviewCommentResponse reply = reviewCommentService.createReply(request, userDetail.getUser().getId());
        return ResponseEntity.ok(reply);
    }

    /**
     * 댓글과 답글을 계층적으로 조회
     */
    @GetMapping("/with-replies")
    public ResponseEntity<?> getCommentsWithReplies(
            @PathVariable("review-id") Long reviewId) {

        List<ReviewCommentWithRepliesResponse> commentsWithReplies = reviewCommentService.getCommentsWithReplies(reviewId);
        return ResponseEntity.ok(commentsWithReplies);
    }

    /**
     * 특정 댓글의 답글들 조회
     */
    @GetMapping("/{comment-id}/replies")
    public ResponseEntity<?> getRepliesByParentId(
            @PathVariable("comment-id") Long commentId) {

        List<ReviewCommentResponse> replies = reviewCommentService.getRepliesByParentId(commentId);
        return ResponseEntity.ok(replies);
    }

}
