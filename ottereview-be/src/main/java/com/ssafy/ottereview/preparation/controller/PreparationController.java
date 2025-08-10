package com.ssafy.ottereview.preparation.controller;

import com.ssafy.ottereview.preparation.dto.PreparationResult;
import com.ssafy.ottereview.preparation.dto.request.AdditionalInfoRequest;
import com.ssafy.ottereview.preparation.dto.request.PreparationValidationRequest;
import com.ssafy.ottereview.preparation.service.PreparationService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import io.swagger.v3.oas.annotations.Operation;
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
public class PreparationController {
    
    private final PreparationService preparationService;
    
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
        return ResponseEntity.ok(preparationService.validatePullRequest(userDetail, repoId, request));
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
        
        return ResponseEntity.ok(preparationService.getPreparePullRequestInfo(userDetail, repoId, source, target));
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
        preparationService.enrollAdditionalInfo(userDetail, repoId, request);
        return ResponseEntity.ok()
                .build();
    }
}
