package com.ssafy.ottereview.pullrequest.controller;

import com.ssafy.ottereview.common.annotation.MvcController;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.pullrequest.service.PullRequestService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@MvcController
public class UserPullRequestController {

    private final PullRequestService pullRequestService;

    @GetMapping("/api/repositories/pull-requests/me")
    @Operation(
            summary = "내 Pull Request 목록 조회",
            description = "로그인한 사용자가 작성한 Pull Request 목록을 조회합니다."
    )
    public ResponseEntity<List<PullRequestResponse>> getMyPullRequests(
            @AuthenticationPrincipal CustomUserDetail userDetail) {
        return ResponseEntity.ok(pullRequestService.getMyPullRequests(userDetail));
    }

}
