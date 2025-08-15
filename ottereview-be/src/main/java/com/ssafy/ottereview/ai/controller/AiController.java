package com.ssafy.ottereview.ai.controller;

import com.ssafy.ottereview.ai.client.AiClient;
import com.ssafy.ottereview.ai.dto.AiCushionRequest;
import com.ssafy.ottereview.ai.dto.request.AiRequest;
import com.ssafy.ottereview.ai.dto.response.AiConventionResponse;
import com.ssafy.ottereview.ai.dto.request.AiConventionRequest;
import com.ssafy.ottereview.ai.dto.response.AiCushionResponse;
import com.ssafy.ottereview.ai.dto.response.AiResult;
import com.ssafy.ottereview.ai.dto.response.AiPriorityResponse;
import com.ssafy.ottereview.ai.dto.response.AiReviewerResponse;
import com.ssafy.ottereview.ai.dto.response.AiSummaryResponse;
import com.ssafy.ottereview.ai.dto.response.AiTitleResponse;
import com.ssafy.ottereview.common.annotation.WebFluxController;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/ai")
@WebFluxController
public class AiController {

    private final AiClient aiClient;

    @PostMapping("/recommendation/title")
    public Mono<ResponseEntity<AiTitleResponse>> getTitleRecommendation(@RequestBody AiRequest request) {
        return aiClient.recommendTitle(request)
                .map(ResponseEntity::ok);
    }

    @PostMapping("/recommendation/priorities")
    public Mono<ResponseEntity<AiPriorityResponse>> getPriorityRecommendation(@RequestBody AiRequest request) {
        return aiClient.recommendPriority(request)
                .map(ResponseEntity::ok);
    }

    @PostMapping("/summary")
    public Mono<ResponseEntity<AiSummaryResponse>> getSummary(@RequestBody AiRequest request) {
        return aiClient.getSummary(request)
                .map(ResponseEntity::ok);
    }
    
    @PostMapping("/recommendation/reviewers")
    public Mono<ResponseEntity<AiReviewerResponse>> getReviewersRecommendation(@RequestBody AiRequest request) {
        return aiClient.recommendReviewers(request)
                .map(ResponseEntity::ok);
    }
    
    @PostMapping("/conventions/check")
    public Mono<ResponseEntity<AiConventionResponse>> checkCodingConvention(@RequestBody AiConventionRequest request) {
        return aiClient.checkCodingConvention(request)
                .map(ResponseEntity::ok);
    }
    
    @PostMapping("/cushions")
    public Mono<ResponseEntity<AiCushionResponse>> applyCushion(@RequestBody AiCushionRequest request) {
        return aiClient.applyCushion(request)
                .map(ResponseEntity::ok);
    }
    
    @PostMapping("/cushions")
    public Mono<ResponseEntity<AiCushionResponse>> applyCushion(@RequestBody AiCushionRequest request) {
        return aiClient.applyCushion(request)
                .map(ResponseEntity::ok)
                .doOnSuccess(response -> log.info("쿠션어 변환 완료"))
                .doOnError(error -> log.error("쿠션어 변환 실패", error))
                .onErrorResume(error -> {
                    // 에러 발생 시 기본 요약 응답
                    AiCushionResponse defaultResponse = new AiCushionResponse("쿠션어 변환 실패");
                    
                    return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                            .body(defaultResponse));
                });
    }
    
    @PostMapping("/all")
    public Mono<ResponseEntity<AiResult>> getAllAi(@AuthenticationPrincipal CustomUserDetail customUserDetail, @RequestBody AiRequest request) {
        return aiClient.analyzeAll(customUserDetail, request)
                .map(ResponseEntity::ok);
    }
}
