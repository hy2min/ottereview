package com.ssafy.ottereview.reviewcomment.controller;

import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentCreateRequest;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentResponse;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentUpdateRequest;
import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/pull-requests/{pr-id}/comments")
@RequiredArgsConstructor
@Slf4j
public class ReviewCommentController {

    private final ReviewCommentService reviewCommentService;

    @PostMapping
    public ResponseEntity<?> createComment(
            @PathVariable("pr-id") Long prId,
            @ModelAttribute("comment") ReviewCommentCreateRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal CustomUserDetail userDetail) {


        ReviewCommentResponse comment = reviewCommentService.createComment(prId, request, file, userDetail.getUser().getId());
        return ResponseEntity.ok(comment);

    }
    
    @GetMapping
    public ResponseEntity<?> getCommentsByPullRequest(
            @PathVariable("pr-id") Long prId) {

            List<ReviewCommentResponse> comments = reviewCommentService.getCommentsByPullRequestId(prId);
            return ResponseEntity.ok(comments);

    }

//    @PutMapping("/{comment-id}")
//    public ResponseEntity<CommentResponse> getComment(
//            @PathVariable("pr-id") Long prId,
//            @PathVariable("comment-id") Long commentId) {
//
//        try {
//            CommentResponse comment = commentService.getCommentById(commentId);
//            return ResponseEntity.ok(comment);
//        } catch (IllegalArgumentException e) {
//            return ResponseEntity.notFound().build();
//        }
//    }

    @PutMapping("/{comment-id}")
    public ResponseEntity<?> updateComment(
            @PathVariable("pr-id") Long prId,
            @PathVariable("comment-id") Long commentId,
            @ModelAttribute ReviewCommentUpdateRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal CustomUserDetail userDetail) {

        ReviewCommentResponse comment = reviewCommentService.updateComment(commentId, request, userDetail.getUser().getId(), file);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/{comment-id}")
    public ResponseEntity<String> deleteComment(
            @PathVariable("pr-id") Long prId,
            @PathVariable("comment-id") Long commentId,
            @AuthenticationPrincipal CustomUserDetail userDetail) {
        

        reviewCommentService.deleteComment(commentId, userDetail.getUser().getId());
        return ResponseEntity.ok("댓글이 성공적으로 삭제되었습니다.");
    }
    
//    @PostMapping("/upload")
//    public ResponseEntity<String> uploadFile(
//            @PathVariable("pr-id") Long prId,
//            @RequestPart("file") MultipartFile file) {
//
//        try {
//            String fileUrl = commentService.uploadFile(file, prId);
//            return ResponseEntity.ok(fileUrl);
//        } catch (Exception e) {
//            return ResponseEntity.internalServerError().body("파일 업로드에 실패했습니다.");
//        }
//    }

}