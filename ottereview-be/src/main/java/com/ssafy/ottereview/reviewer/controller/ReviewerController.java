package com.ssafy.ottereview.reviewer.controller;

import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.reviewer.service.ReviewerService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviewers")
public class ReviewerController {

    private final ReviewerService reviewerService;

    @GetMapping("/{pr-id}")
    @Operation(
            summary = "PR 리뷰어 리스트 조회",
            description = "특정 Pull Request에 대한 리뷰어 리스트를 조회합니다. PR ID를 통해 해당 Pull Request에 할당된 리뷰어들을 반환합니다."
    )
    public ResponseEntity<?> getUsersByPullRequest(@AuthenticationPrincipal CustomUserDetail customUserDetail,
            @PathVariable(name = "pr-id") Long pullRequestId) {
        return ResponseEntity.ok(reviewerService.getReviewerByPullRequest(pullRequestId));
    }

    @GetMapping("/my/pull-requests")
    @Operation(
            summary = "내가 리뷰어로 참여한 Pull Requests 조회",
            description = "내가 리뷰어로 참여한 Pull Requests 리스트를 조회합니다. 이 API는 현재 로그인한 사용자가 리뷰어로 참여하고 있는 Pull Requests를 반환합니다."
    )
    public ResponseEntity<List<PullRequestResponse>> getMyReviewPullRequests(@AuthenticationPrincipal CustomUserDetail customUserDetail) {
        return ResponseEntity.ok(reviewerService.getMyReviewPullRequests(customUserDetail));
    }
}
