package com.ssafy.ottereview.reviewer;

import com.ssafy.ottereview.pullrequest.service.PullRequestService;
import com.ssafy.ottereview.reviewer.service.ReviewerService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/reviewers")
public class ReviewerController {

    private final ReviewerService reviewerService;
    private final PullRequestService pullRequestService;

    @GetMapping("/{pr-id}")
    public ResponseEntity<?> getUserByPullRequest(CustomUserDetail customUserDetail,
            @PathVariable(name = "pr-id") Long pullRequestId) {
        return ResponseEntity.ok(reviewerService.getReviewerByPullRequest(pullRequestId));
    }
}
