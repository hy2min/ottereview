package com.ssafy.ottereview.ai.controller;

import com.ssafy.ottereview.ai.client.AiClient;
import com.ssafy.ottereview.ai.dto.response.AiConventionResponse;
import com.ssafy.ottereview.ai.dto.request.AiRequest;
import com.ssafy.ottereview.ai.dto.response.AiResult;
import com.ssafy.ottereview.ai.dto.response.AiPriorityResponse;
import com.ssafy.ottereview.ai.dto.response.AiReviewerResponse;
import com.ssafy.ottereview.ai.dto.response.AiSummaryResponse;
import com.ssafy.ottereview.ai.dto.response.AiTitleResponse;
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
public class AiController {

    private final AiClient aiClient;

    @PostMapping("/recommendation/title")
    public Mono<ResponseEntity<AiTitleResponse>> getTitleRecommendation(@RequestBody AiRequest request) {
        return aiClient.recommendTitle(request)
                .map(ResponseEntity::ok)
                .doOnSuccess(response -> log.info("AI 제목 추천 완료"))
                .doOnError(error -> log.error("AI 제목 추천 실패", error))
                .onErrorResume(error -> {
                    // 에러 발생 시 기본 응답
                    AiTitleResponse defaultResponse = new AiTitleResponse("제목 추천 실패");

                    return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                            .body(defaultResponse));
                });
    }

    @PostMapping("/recommendation/priority")  // GET → POST 변경
    public Mono<ResponseEntity<AiPriorityResponse>> getPriorityRecommendation(@RequestBody AiRequest request) {

        log.info("AI 우선순위 추천 요청 - repoId: {}", request.getRepoId());

        return aiClient.recommendPriority(request)
                .map(ResponseEntity::ok)
                .doOnSuccess(response -> log.info("AI 우선순위 추천 완료"))
                .doOnError(error -> log.error("AI 우선순위 추천 실패", error))
                .onErrorResume(error -> {
                    // 에러 발생 시 기본 우선순위 응답
                    AiPriorityResponse defaultResponse = AiPriorityResponse.createDefaultPriorityResponse();

                    return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                            .body(defaultResponse));
                });
    }

    @PostMapping("/summary")
    public Mono<ResponseEntity<AiSummaryResponse>> getSummary(@RequestBody AiRequest request) {
        return aiClient.getSummary(request)
                .map(ResponseEntity::ok)
                .doOnSuccess(response -> log.info("AI 요약 생성 완료"))
                .doOnError(error -> log.error("AI 요약 생성 실패", error))
                .onErrorResume(error -> {
                    // 에러 발생 시 기본 요약 응답
                    AiSummaryResponse defaultResponse = new AiSummaryResponse("요약 실패");

                    return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                            .body(defaultResponse));
                });
    }
    
    @PostMapping("/recommendation/reviewers")
    public Mono<ResponseEntity<AiReviewerResponse>> getReviewersRecommendation(@RequestBody AiRequest request) {
        return aiClient.recommendReviewers(request)
                .map(ResponseEntity::ok)
                .doOnSuccess(response -> log.info("리뷰어 추천 완료"))
                .doOnError(error -> log.error("리뷰어 추천 실패", error))
                .onErrorResume(error -> {
                    // 에러 발생 시 기본 요약 응답
                    AiReviewerResponse defaultResponse = new AiReviewerResponse();
                    
                    return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                            .body(defaultResponse));
                });
    }
    
    @PostMapping("/conventions/check")
    public Mono<ResponseEntity<AiConventionResponse>> checkCodingConvention(@RequestBody AiRequest request) {
        return aiClient.checkCodingConvention(request)
                .map(ResponseEntity::ok)
                .doOnSuccess(response -> log.info("컨벤션 체크 완료"))
                .doOnError(error -> log.error("컨벤션 체크 실패", error))
                .onErrorResume(error -> {
                    // 에러 발생 시 기본 요약 응답
                    AiConventionResponse defaultResponse = new AiConventionResponse("컨벤션 체크 실패");
                    
                    return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                            .body(defaultResponse));
                });
    }
    
    @PostMapping("/all")
    public Mono<ResponseEntity<AiResult>> getAllAi(@AuthenticationPrincipal CustomUserDetail customUserDetail, @RequestBody AiRequest request) {
        return aiClient.analyzeAll(customUserDetail, request)
                .map(ResponseEntity::ok)
                .doOnSuccess(response -> log.info("전체 api 요청 완료"))
                .doOnError(error -> log.error("전체 api 요청 실패", error))
                .onErrorResume(error -> {
                    // 에러 발생 시 기본 요약 응답
                    AiResult defaultResponse = new AiResult();

                    return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                            .body(defaultResponse));
                });
    }
}
