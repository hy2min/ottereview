package com.ssafy.ottereview.pullrequest.controller;

import com.ssafy.ottereview.pullrequest.dto.request.PullRequestCreateRequest;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestDetailResponse;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.pullrequest.service.PullRequestService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/repositories/{repo-id}/pull-requests")
@RequiredArgsConstructor
public class PullRequestController {
    
    private final PullRequestService pullRequestService;

    @GetMapping("/github")
    @Operation(
            summary = "Github에서 Pull Request 목록 조회",
            description = "GitHub API를 호출하여 동기화한 후 해당 레포지토리의 Pull Request 목록을 반환합니다."
    )
    public ResponseEntity<List<PullRequestResponse>> getPullRequestsByGithub(@AuthenticationPrincipal CustomUserDetail userDetail, @PathVariable("repo-id") Long repositoryId) {
        return ResponseEntity.ok(pullRequestService.getPullRequestsByGithub(userDetail, repositoryId));
    }
    
    @GetMapping("/search")
    @Operation(
            summary = "브랜치 정보를 이용한 Open 상태 Pull Request 단일 조회",
            description = "특정 레포지토리의 소스 브랜치와 타겟 브랜치에 대한 Pull-Request를 조회합니다."
    )
    public ResponseEntity<PullRequestResponse> getPullRequestByBranch(
            @AuthenticationPrincipal CustomUserDetail userDetail,
            @PathVariable("repo-id") Long repoId,
            @RequestParam String source,
            @RequestParam String target
    ) {
        PullRequestResponse pullRequest = pullRequestService.getPullRequestByBranch(userDetail, repoId, source, target);
        return ResponseEntity.ok(pullRequest);
    }
    
    @GetMapping("/{pr-id}")
    @Operation(
            summary = "Pull Request 상세 조회",
            description = "특정 Pull Request의 상세 정보를 조회합니다."
    )
    public ResponseEntity<PullRequestDetailResponse> getPullRequest(@AuthenticationPrincipal CustomUserDetail userDetail, @PathVariable("repo-id") Long repoId, @PathVariable("pr-id") Long pullRequestId) {
        return ResponseEntity.ok(pullRequestService.getPullRequestById(userDetail, repoId, pullRequestId));
    }
    
    @GetMapping()
    @Operation(
            summary = "레포지토리 Pull Request 목록 조회",
            description = "특정 레포지토리에 대한 Pull Request 목록을 조회합니다."
    )
    public ResponseEntity<List<PullRequestResponse>> getPullRequests(@AuthenticationPrincipal CustomUserDetail userDetail, @PathVariable("repo-id") Long repoId) {
        return ResponseEntity.ok(pullRequestService.getPullRequests(userDetail, repoId));
    }

    @PostMapping()
    @Operation(
            summary = "Pull Request 생성",
            description = "새로운 Pull Request를 생성합니다."
    )
    public ResponseEntity<Void> createPullRequest(
            @AuthenticationPrincipal CustomUserDetail userDetail,
            @PathVariable("repo-id") Long repoId,
            @RequestBody PullRequestCreateRequest request) {
        
        pullRequestService.createPullRequest(userDetail, repoId, request);
        return ResponseEntity.ok()
                .build();
    }
}
