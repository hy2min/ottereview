package com.ssafy.ottereview.reviewer.controller;

import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.pullrequest.service.PullRequestService;
import com.ssafy.ottereview.reviewer.service.ReviewerService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/reviewers")
public class ReviewerController {

    private final ReviewerService reviewerService;

    @GetMapping("/{pr-id}")
    public ResponseEntity<?> getUserByPullRequest(@AuthenticationPrincipal CustomUserDetail customUserDetail,
            @PathVariable(name = "pr-id") Long pullRequestId) {
        return ResponseEntity.ok(reviewerService.getReviewerByPullRequest(pullRequestId));
    }

    @GetMapping("/my/pull-requests")
    public ResponseEntity<List<PullRequestResponse>> getMyReviewPullRequests(@AuthenticationPrincipal CustomUserDetail customUserDetail) {
        return ResponseEntity.ok(reviewerService.getMyReviewPullRequests(customUserDetail));
    }
}
