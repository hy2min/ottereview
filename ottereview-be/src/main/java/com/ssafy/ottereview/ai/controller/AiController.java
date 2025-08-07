package com.ssafy.ottereview.ai.controller;

import com.ssafy.ottereview.ai.client.AiClient;
import com.ssafy.ottereview.ai.dto.AiRequest;
import com.ssafy.ottereview.ai.dto.PriorityResponse;
import com.ssafy.ottereview.ai.dto.SummaryResponse;
import com.ssafy.ottereview.ai.dto.TitleResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public Mono<ResponseEntity<TitleResponse>> getTitleRecommendation(@RequestBody AiRequest request) {
        return aiClient.recommendTitle(request)
                .map(ResponseEntity::ok)
                .doOnSuccess(response -> log.info("AI 제목 추천 완료"))
                .doOnError(error -> log.error("AI 제목 추천 실패", error))
                .onErrorResume(error -> {
                    // 에러 발생 시 기본 응답
                    TitleResponse defaultResponse = new TitleResponse("제목을 입력해주세요");

                    return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                            .body(defaultResponse));
                });
    }

    @PostMapping("/recommendation/priority")  // GET → POST 변경
    public Mono<ResponseEntity<PriorityResponse>> getPriorityRecommendation(@RequestBody AiRequest request) {

        log.info("AI 우선순위 추천 요청 - repoId: {}", request.getRepoId());

        return aiClient.recommendPriority(request)
                .map(ResponseEntity::ok)
                .doOnSuccess(response -> log.info("AI 우선순위 추천 완료"))
                .doOnError(error -> log.error("AI 우선순위 추천 실패", error))
                .onErrorResume(error -> {
                    // 에러 발생 시 기본 우선순위 응답
                    PriorityResponse defaultResponse = createDefaultPriorityResponse();

                    return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                            .body(defaultResponse));
                });
    }

    @PostMapping("/summary")
    public Mono<ResponseEntity<SummaryResponse>> getSummary(@RequestBody AiRequest request) {
        return aiClient.getSummary(request)
                .map(ResponseEntity::ok)
                .doOnSuccess(response -> log.info("AI 요약 생성 완료"))
                .doOnError(error -> log.error("AI 요약 생성 실패", error))
                .onErrorResume(error -> {
                    // 에러 발생 시 기본 요약 응답
                    SummaryResponse defaultResponse = new SummaryResponse("요약을 입력해주세요");

                    return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                            .body(defaultResponse));
                });
    }

    private PriorityResponse createDefaultPriorityResponse() {
        PriorityResponse.PriorityItem defaultItem = PriorityResponse.PriorityItem.builder()
                .title("일반적인 코드 리뷰")
                .priorityLevel("MEDIUM")
                .reason("우선순위를 수동으로 설정해주세요")
                .build();

        return PriorityResponse.builder()
                .result(PriorityResponse.PriorityResult.builder()
                        .priority(java.util.List.of(defaultItem))
                        .build())
                .build();
    }
}
