package com.ssafy.ottereview.pullrequest.controller;

import com.ssafy.ottereview.pullrequest.dto.preparation.PreparationData;
import com.ssafy.ottereview.pullrequest.dto.preparation.request.AdditionalInfoRequest;
import com.ssafy.ottereview.pullrequest.dto.preparation.request.PreparationValidationRequest;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestDetailResponse;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.pullrequest.service.PullRequestPreparationService;
import com.ssafy.ottereview.pullrequest.service.PullRequestService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
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
    
    /**
     * @param userDetail 인증된 사용자 정보
     * @param repoId     레포지토리 ID
     * @param request    Pull Request 생성 가능한지에 대한 요청 정보
     * @return PR 생성을 위해 필요한 정보 응답
     */
    @PostMapping("/preparation/validation")
    public ResponseEntity<PreparationData> validatePullRequest(
            @AuthenticationPrincipal CustomUserDetail userDetail,
            @PathVariable("repo-id") Long repoId,
            @RequestBody PreparationValidationRequest request) {
        
        // GitHub API로 상태 확인 후 생성
        return ResponseEntity.ok(pullRequestPreparationService.validatePullRequest(userDetail, repoId, request));
    }
    
    @GetMapping("/preparation")
    public ResponseEntity<PreparationData> getPreparationInfo(
            @AuthenticationPrincipal CustomUserDetail userDetail,
            @PathVariable("repo-id") Long repoId,
            @RequestParam("source") String source,
            @RequestParam("target") String target) {
        
        return ResponseEntity.ok(pullRequestPreparationService.getPreparePullRequestInfo(userDetail, repoId, source, target));
    }
    
    @PostMapping("/preparation/additional-info")
    public ResponseEntity<Void> enrollPreparePullRequestAdditionalInfo(
            @AuthenticationPrincipal CustomUserDetail userDetail,
            @PathVariable("repo-id") Long repoId,
            @RequestBody AdditionalInfoRequest request) {
        
        // GitHub API로 상태 확인 후 준비 정보 반환
        pullRequestPreparationService.enrollAdditionalInfo(userDetail, repoId, request);
        return ResponseEntity.ok()
                .build();
    }
    
    /**
     * repositoryId에 해당하는 Pull Request 목록을 조회합니다. github api를 호출해서 동기화 한 후 저장된 Pull Request 목록을 반환합니다.
     *
     * @param repositoryId 레포지토리 ID
     * @return repositoryId에 해당하는 Pull Request 목록
     */
    @GetMapping()
    public ResponseEntity<List<PullRequestResponse>> getPullRequestsByRepositoryId(@AuthenticationPrincipal CustomUserDetail userDetail, @PathVariable("repo-id") Long repositoryId) {
        return ResponseEntity.ok(pullRequestService.getPullRequestsByRepositoryId(userDetail, repositoryId));
    }
    
    @GetMapping("/{pr-id}")
    public ResponseEntity<PullRequestDetailResponse> getPullRequestById(@AuthenticationPrincipal CustomUserDetail userDetail, @PathVariable("pr-id") Long pullRequestId) {
        return ResponseEntity.ok(pullRequestService.getPullRequestById(userDetail, pullRequestId));
    }
}
