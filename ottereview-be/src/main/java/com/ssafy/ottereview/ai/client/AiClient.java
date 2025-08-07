package com.ssafy.ottereview.ai.client;

import com.ssafy.ottereview.account.service.UserAccountService;
import com.ssafy.ottereview.ai.dto.AiRequest;
import com.ssafy.ottereview.ai.dto.ConventionResponse;
import com.ssafy.ottereview.ai.dto.PrAnalysisResult;
import com.ssafy.ottereview.ai.dto.PriorityResponse;
import com.ssafy.ottereview.ai.dto.ReviewerResponse;
import com.ssafy.ottereview.ai.dto.SummaryResponse;
import com.ssafy.ottereview.ai.dto.TitleResponse;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Transactional
@Service
@RequiredArgsConstructor
public class AiClient {

    private final WebClient aiWebClient;
    private final RedisTemplate<String, Object> redisTemplate;
    private final UserAccountService userAccountService;

    /**
     * PR 제목 생성
     */
    public Mono<TitleResponse> recommendTitle(AiRequest request) {

        return aiWebClient.post()
                .uri("/ai/pull_requests/title")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(TitleResponse.class)
                .timeout(Duration.ofMinutes(1))
                .doOnSuccess(title -> log.info("Title 생성 완료: {}", title))
                .doOnError(error -> log.error("Title 생성 실패", error))
                .onErrorReturn(new TitleResponse("제목을 입력해주세요"));  // 기본값 제공
    }

    /**
     * PR 요약 생성
     */
    public Mono<SummaryResponse> getSummary(AiRequest request) {

        return aiWebClient.post()
                .uri("/ai/pull_requests/summary")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(SummaryResponse.class)
                .timeout(Duration.ofMinutes(1))
                .doOnSuccess(summary -> log.info("Summary 생성 완료"))
                .doOnError(error -> log.error("Summary 생성 실패", error))
                .onErrorReturn(new SummaryResponse("요약을 입력해주세요"));
    }

    /**
     * 리뷰어 추천
     */
    public Mono<ReviewerResponse> recommendReviewers(AiRequest request) {

        return aiWebClient.post()
                .uri("/ai/reviewers/recommend")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ReviewerResponse.class)
                .timeout(Duration.ofMinutes(1))
                .doOnSuccess(reviewers -> log.info("Reviewers 추천 완료: {}", reviewers))
                .doOnError(error -> log.error("Reviewers 추천 실패", error))
                .onErrorReturn(new ReviewerResponse("결과 없음"));
    }

    /**
     * 우선순위 추천
     */
    public Mono<PriorityResponse> recommendPriority(AiRequest request) {

        return aiWebClient.post()
                .uri("/ai/priority/recommend")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(PriorityResponse.class)
                .timeout(Duration.ofMinutes(1))
                .doOnSuccess(priority -> log.info("Priority 추천 완료: {}", priority))
                .doOnError(error -> log.error("Priority 추천 실패", error))
                .onErrorReturn(createDefaultPriorityResponse());
    }

    /**
     * 코딩 컨벤션 검사
     */
    public Mono<ConventionResponse> checkCodingConvention(AiRequest request) {

        return aiWebClient.post()
                .uri("/ai/coding-convention/ai")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ConventionResponse.class)
                .timeout(Duration.ofMinutes(1))
                .doOnSuccess(conventions -> log.info("Coding Convention 검사 완료"))
                .doOnError(error -> log.error("Coding Convention 검사 실패", error))
                .onErrorReturn(new ConventionResponse("결과 없음"));
    }

    /**
     * 모든 AI 분석을 병렬로 실행
     */
    public Mono<PrAnalysisResult> analyzeAll(CustomUserDetail customUserDetail, AiRequest request) {

        // 검증
        userAccountService.validateUserPermission(customUserDetail.getUser()
                .getId(), request.getRepoId());

        String sessionId = UUID.randomUUID()
                .toString();

        LocalDateTime startTime = LocalDateTime.now();

        log.info("PR 전체 분석 시작 - Session: {}", sessionId);

        // 모든 AI API를 동시에 병렬 호출
        Mono<TitleResponse> titleMono = recommendTitle(request)
                .doOnSubscribe(sub -> log.info("Title 분석 시작"));

        Mono<SummaryResponse> summaryMono = getSummary(request)
                .doOnSubscribe(sub -> log.info("Summary 분석 시작"));

        Mono<ReviewerResponse> reviewersMono = recommendReviewers(request)
                .doOnSubscribe(sub -> log.info("Reviewers 분석 시작"));

        Mono<PriorityResponse> priorityMono = recommendPriority(request)
                .doOnSubscribe(sub -> log.info("Priority 분석 시작"));

        Mono<ConventionResponse> conventionMono = checkCodingConvention(request)
                .doOnSubscribe(sub -> log.info("Convention 분석 시작"));

        // 모든 결과를 조합
        return Mono.zip(titleMono, summaryMono, reviewersMono, priorityMono, conventionMono)
                .map(results -> {
                    PrAnalysisResult analysisResult = PrAnalysisResult.builder()
                            .sessionId(sessionId)
                            .title(results.getT1())
                            .summary(results.getT2())
                            .reviewers(results.getT3())
                            .priority(results.getT4())
                            .conventions(results.getT5())
                            .analysisTime(startTime)
                            .success(true)
                            .build();

                    // Redis에 결과 캐시 (30분 보관)
                    cacheResults(sessionId, analysisResult);

                    return analysisResult;
                })
                .timeout(Duration.ofMinutes(5))  // 전체 타임아웃 5분
                .doOnSuccess(result -> {
                    Duration duration = Duration.between(startTime, LocalDateTime.now());
                    log.info("PR 전체 분석 완료 - Session: {}, 소요시간: {}초",
                            sessionId, duration.toSeconds());
                })
                .doOnError(error -> {
                    Duration duration = Duration.between(startTime, LocalDateTime.now());
                    log.error("PR 전체 분석 실패 - Session: {}, 소요시간: {}초",
                            sessionId, duration.toSeconds(), error);
                })
                .onErrorResume(error -> {
                    // 전체 실패 시 부분 결과 제공
                    return handlePartialFailure(sessionId, startTime, error);
                });
    }

    private PriorityResponse createDefaultPriorityResponse() {
        PriorityResponse.PriorityItem defaultItem = PriorityResponse.PriorityItem.builder()
                .title("기본 우선순위")
                .priorityLevel("MEDIUM")
                .reason("우선순위를 수동으로 설정해주세요")
                .build();

        return PriorityResponse.builder()
                .result(PriorityResponse.PriorityResult.builder()
                        .priority(List.of(defaultItem))
                        .build())
                .build();
    }

    /**
     * 부분 실패 처리
     */
    private Mono<PrAnalysisResult> handlePartialFailure(String sessionId, LocalDateTime startTime, Throwable error) {
        log.warn("부분 실패 처리 시작 - Session: {}", sessionId);

        return Mono.just(PrAnalysisResult.builder()
                .sessionId(sessionId)
                .title(new TitleResponse("제목을 입력해주세요"))
                .summary(new SummaryResponse("요약을 입력해주세요"))
                .reviewers(new ReviewerResponse("리뷰어를 선택해주세요"))
                .priority(new PriorityResponse())
                .conventions(new ConventionResponse())
                .analysisTime(startTime)
                .success(false)
                .errorMessage("AI 분석 중 일부 실패: " + error.getMessage())
                .build());
    }

    /**
     * 결과 캐싱
     */
    private void cacheResults(String sessionId, PrAnalysisResult result) {
        try {
            redisTemplate.opsForValue()
                    .set(
                            "pr:analysis:" + sessionId,
                            result,
                            Duration.ofMinutes(30)  // 30분 캐시
                    );
            log.info("분석 결과 캐시 저장 완료 - Session: {}", sessionId);
        } catch (Exception e) {
            log.warn("캐시 저장 실패 - Session: {}", sessionId, e);
        }
    }

    /**
     * 캐시된 결과 조회
     */
//    public Mono<PrAnalysisResult> getCachedResults(String sessionId) {
//        return Mono.fromCallable(() -> {
//                    Object cached = redisTemplate.opsForValue()
//                            .get("pr:analysis:" + sessionId);
//                    if (cached instanceof PrAnalysisResult) {
//                        log.info("캐시된 결과 반환 - Session: {}", sessionId);
//                        return (PrAnalysisResult) cached;
//                    }
//                    return null;
//                })
//                .subscribeOn(Schedulers.boundedElastic())
//                .onErrorResume(error -> {
//                    log.warn("캐시 조회 실패 - Session: {}", sessionId, error);
//                    return Mono.empty();
//                });
//    }
}