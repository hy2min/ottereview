package com.ssafy.ottereview.pullrequest.controller;

import com.ssafy.ottereview.pullrequest.dto.preparation.PreparationResult;
import com.ssafy.ottereview.pullrequest.dto.preparation.request.AdditionalInfoRequest;
import com.ssafy.ottereview.pullrequest.dto.preparation.request.PreparationValidationRequest;
import com.ssafy.ottereview.pullrequest.dto.request.PullRequestCreateRequest;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestDetailResponse;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.pullrequest.service.PullRequestPreparationService;
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
    private final PullRequestPreparationService pullRequestPreparationService;

    @PostMapping("/preparation/validation")
    @Operation(
            summary = "Pull Request 생성 검증",
            description = "Pull Request 생성 가능 여부를 검증하고 필요한 준비 정보를 반환합니다."
    )
    public ResponseEntity<PreparationResult> validatePullRequest(
            @AuthenticationPrincipal CustomUserDetail userDetail,
            @PathVariable("repo-id") Long repoId,
            @RequestBody PreparationValidationRequest request) {
        
        // GitHub API로 상태 확인 후 생성
        return ResponseEntity.ok(pullRequestPreparationService.validatePullRequest(userDetail, repoId, request));
    }

    @GetMapping("/preparation")
    @Operation(
            summary = "Pull Request 준비 정보 조회",
            description = "소스 브랜치와 타겟 브랜치 간의 Pull Request 생성을 위한 준비 정보를 조회합니다."
    )
    public ResponseEntity<PreparationResult> getPreparationInfo(
            @AuthenticationPrincipal CustomUserDetail userDetail,
            @PathVariable("repo-id") Long repoId,
            @RequestParam("source") String source,
            @RequestParam("target") String target) {
        
        return ResponseEntity.ok(pullRequestPreparationService.getPreparePullRequestInfo(userDetail, repoId, source, target));
    }

    @PostMapping("/preparation/additional-info")
    @Operation(
            summary = "Pull Request 추가 정보 등록",
            description = "Pull Request 생성을 위한 추가 정보를 등록합니다."
    )
    public ResponseEntity<Void> enrollPreparePullRequestAdditionalInfo(
            @AuthenticationPrincipal CustomUserDetail userDetail,
            @PathVariable("repo-id") Long repoId,
            @RequestBody AdditionalInfoRequest request) {
        
        // GitHub API로 상태 확인 후 준비 정보 반환
        pullRequestPreparationService.enrollAdditionalInfo(userDetail, repoId, request);
        return ResponseEntity.ok()
                .build();
    }

    @GetMapping("/github")
    @Operation(
            summary = "Github에서 Pull Request 목록 조회",
            description = "GitHub API를 호출하여 동기화한 후 해당 레포지토리의 Pull Request 목록을 반환합니다."
    )
    public ResponseEntity<List<PullRequestResponse>> getPullRequestsByGithub(@AuthenticationPrincipal CustomUserDetail userDetail, @PathVariable("repo-id") Long repositoryId) {
        return ResponseEntity.ok(pullRequestService.getPullRequestsByGithub(userDetail, repositoryId));
    }

    @GetMapping("/api/repositories/pull-requests/me")
    @Operation(
            summary = "내 Pull Request 목록 조회",
            description = "로그인한 사용자가 작성한 Pull Request 목록을 조회합니다."
    )
    public ResponseEntity<List<PullRequestResponse>> getMyPullRequests(@AuthenticationPrincipal CustomUserDetail userDetail, @PathVariable("repo-id") Long repoId) {
        return ResponseEntity.ok(pullRequestService.getMyPullRequests(userDetail));
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
