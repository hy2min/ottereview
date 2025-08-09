package com.ssafy.ottereview.ai.client;

import com.ssafy.ottereview.account.service.UserAccountService;
import com.ssafy.ottereview.ai.dto.request.AiRequest;
import com.ssafy.ottereview.ai.dto.response.AiConventionResponse;
import com.ssafy.ottereview.ai.dto.response.AiPriorityResponse;
import com.ssafy.ottereview.ai.dto.response.AiResult;
import com.ssafy.ottereview.ai.dto.response.AiReviewerResponse;
import com.ssafy.ottereview.ai.dto.response.AiSummaryResponse;
import com.ssafy.ottereview.ai.dto.response.AiTitleResponse;
import com.ssafy.ottereview.ai.repository.AiRedisRepository;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestDetailResponse;
import com.ssafy.ottereview.pullrequest.service.PullRequestService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Transactional
@Service
@RequiredArgsConstructor
public class AiClient {
    
    private final WebClient aiWebClient;
    private final UserAccountService userAccountService;
    private final AiRedisRepository aiRedisRepository;
    private final PullRequestService pullRequestService;
    
    /**
     * PR 제목 생성
     */
    public Mono<AiTitleResponse> recommendTitle(AiRequest request) {
        
        return aiWebClient.post()
                .uri("/ai/pull_requests/title")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AiTitleResponse.class)
                .timeout(Duration.ofMinutes(1))
                .doOnSuccess(title -> log.info("Title 생성 완료: {}", title))
                .doOnError(error -> log.error("Title 생성 실패", error))
                .onErrorReturn(new AiTitleResponse("제목을 입력해주세요"));  // 기본값 제공
    }
    
    /**
     * PR 요약 생성
     */
    public Mono<AiSummaryResponse> getSummary(AiRequest request) {
        
        return aiWebClient.post()
                .uri("/ai/pull_requests/summary")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AiSummaryResponse.class)
                .timeout(Duration.ofMinutes(1))
                .doOnSuccess(summary -> log.info("Summary 생성 완료"))
                .doOnError(error -> log.error("Summary 생성 실패", error))
                .onErrorReturn(new AiSummaryResponse("요약을 입력해주세요"));
    }
    
    /**
     * 리뷰어 추천
     */
    public Mono<AiReviewerResponse> recommendReviewers(AiRequest request) {
        
        return aiWebClient.post()
                .uri("/ai/reviewers/recommend")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AiReviewerResponse.class)
                .timeout(Duration.ofMinutes(1))
                .doOnSuccess(reviewers -> log.info("Reviewers 추천 완료: {}", reviewers))
                .doOnError(error -> log.error("Reviewers 추천 실패", error))
                .onErrorReturn(new AiReviewerResponse());
    }
    
    /**
     * 우선순위 추천
     */
    public Mono<AiPriorityResponse> recommendPriority(AiRequest request) {
        
        return aiWebClient.post()
                .uri("/ai/priority/recommend")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AiPriorityResponse.class)
                .timeout(Duration.ofMinutes(1))
                .doOnSuccess(priority -> log.info("Priority 추천 완료: {}", priority))
                .doOnError(error -> log.error("Priority 추천 실패", error))
                .onErrorReturn(AiPriorityResponse.createDefaultPriorityResponse());
    }
    
    /**
     * 코딩 컨벤션 검사
     */
    public Mono<AiConventionResponse> checkCodingConvention(AiRequest request) {
        
        return aiWebClient.post()
                .uri("/ai/coding-convention/check")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AiConventionResponse.class)
                .timeout(Duration.ofMinutes(1))
                .doOnSuccess(conventions -> log.info("Coding Convention 검사 완료"))
                .doOnError(error -> log.error("Coding Convention 검사 실패", error))
                .onErrorReturn(new AiConventionResponse("결과 없음"));
    }
    
    /**
     * 모든 AI 분석을 병렬로 실행
     */
    public Mono<AiResult> analyzeAll(CustomUserDetail customUserDetail, AiRequest request) {
        log.info("AI 전체 분석 시작");
        
        // 1. 캐시 조회를 Mono로 감싸서 reactive chain 유지
        return Mono.fromCallable(() -> aiRedisRepository.getAiInfo(request))
                .doOnNext(cachedResult -> {
                    if (cachedResult != null) {
                        log.info("캐시된 AI 정보 조회 성공 - 캐시 히트");
                    }
                })
                .filter(Objects::nonNull)  // null이 아닌 경우만 통과
                .switchIfEmpty(
                        // 2. 캐시가 없는 경우에만 실제 분석 수행
                        performFullAnalysis(customUserDetail, request)
                )
                .doOnSuccess(result -> log.info("AI 전체 분석 완료"))
                .doOnError(error -> log.error("AI 전체 분석 실패", error));
    }
    
    private Mono<AiResult> performFullAnalysis(CustomUserDetail customUserDetail, AiRequest request) {
        log.info("캐시 미스 - 새로운 AI 분석 시작");
        
        LocalDateTime startTime = LocalDateTime.now();
        
        // 3. 권한 검증을 비동기로 수행
        return validateUserPermissionAsync(customUserDetail.getUser()
                .getId(), request.getRepoId())
                .then(executeParallelAnalysis(request, startTime))
                .timeout(Duration.ofMinutes(5))  // 전체 타임아웃 5분
                .doOnSuccess(result -> {
                    Duration duration = Duration.between(startTime, LocalDateTime.now());
                    log.info("PR 전체 분석 완료 - 소요시간: {}초", duration.toSeconds());
                })
                .doOnError(error -> {
                    Duration duration = Duration.between(startTime, LocalDateTime.now());
                    log.error("PR 전체 분석 실패 - 소요시간: {}초", duration.toSeconds(), error);
                })
                .onErrorResume(error -> handlePartialFailure(startTime, error));
    }
    
    private Mono<AiResult> executeParallelAnalysis(AiRequest request, LocalDateTime startTime) {
        log.info("병렬 AI API 호출 시작");
        
        // 4. 각 API 호출에 개별 타임아웃과 fallback 추가
        Mono<AiTitleResponse> titleMono = recommendTitle(request)
                .timeout(Duration.ofMinutes(2))
                .doOnSubscribe(sub -> log.info("Title 분석 시작"))
                .doOnSuccess(result -> log.debug("Title 분석 완료"))
                .onErrorResume(error -> {
                    log.warn("Title 분석 실패, 기본값 사용", error);
                    return Mono.just(createDefaultTitleResponse());
                });
        
        Mono<AiSummaryResponse> summaryMono = getSummary(request)
                .timeout(Duration.ofMinutes(2))
                .doOnSubscribe(sub -> log.info("Summary 분석 시작"))
                .doOnSuccess(result -> log.debug("Summary 분석 완료"))
                .onErrorResume(error -> {
                    log.warn("Summary 분석 실패, 기본값 사용", error);
                    return Mono.just(createDefaultSummaryResponse());
                });
        
        Mono<AiReviewerResponse> reviewersMono = recommendReviewers(request)
                .timeout(Duration.ofMinutes(2))
                .doOnSubscribe(sub -> log.info("Reviewers 분석 시작"))
                .doOnSuccess(result -> log.debug("Reviewers 분석 완료"))
                .onErrorResume(error -> {
                    log.warn("Reviewers 분석 실패, 기본값 사용", error);
                    return Mono.just(createDefaultReviewersResponse());
                });
        
        Mono<AiPriorityResponse> priorityMono = recommendPriority(request)
                .timeout(Duration.ofMinutes(2))
                .doOnSubscribe(sub -> log.info("Priority 분석 시작"))
                .doOnSuccess(result -> log.debug("Priority 분석 완료"))
                .onErrorResume(error -> {
                    log.warn("Priority 분석 실패, 기본값 사용", error);
                    return Mono.just(createDefaultPriorityResponse());
                });
        
        Mono<AiConventionResponse> conventionMono = checkCodingConvention(request)
                .timeout(Duration.ofMinutes(2))
                .doOnSubscribe(sub -> log.info("Convention 분석 시작"))
                .doOnSuccess(result -> log.debug("Convention 분석 완료"))
                .onErrorResume(error -> {
                    log.warn("Convention 분석 실패, 기본값 사용", error);
                    return Mono.just(createDefaultConventionResponse());
                });
        
        // 5. 모든 결과를 조합하고 캐시 저장
        return Mono.zip(titleMono, summaryMono, reviewersMono, priorityMono, conventionMono)
                .map(results -> {
                    AiResult analysisResult = AiResult.builder()
                            .title(results.getT1())
                            .summary(results.getT2())
                            .reviewers(results.getT3())
                            .priority(results.getT4())
                            .conventions(results.getT5())
                            .analysisTime(startTime)
                            .build();
                    
                    log.debug("AI 분석 결과 생성 완료");
                    return analysisResult;
                })
                // 6. 캐시 저장을 비동기로 수행 (결과 반환에 영향 없음)
                .flatMap(result ->
                        saveToCache(request, result)
                                .thenReturn(result)
                                .onErrorResume(cacheError -> {
                                    log.warn("캐시 저장 실패, 결과는 정상 반환", cacheError);
                                    return Mono.just(result);
                                })
                );
    }
    
    public Mono<String> processAudioFile(MultipartFile audioFile) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", audioFile.getResource())
                .contentType(MediaType.MULTIPART_FORM_DATA);
        
        return aiWebClient.post()
                .uri("/ai/speech/transcribe")
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(AiConventionResponse.class) // 응답을 AiResponse 객체로 받음
                .map(AiConventionResponse::getResult) // AiResponse 객체에서 "result" 필드 값만 추출
                .onErrorResume(throwable -> {
                    System.err.println("파일 전송 중 오류 발생: " + throwable.getMessage());
                    return Mono.just("AI 음성 처리 실패");
                });
    }
    
    public Mono<Void> saveVectorDb(CustomUserDetail customUserDetail, Long repoId, Long prId) {
        
        PullRequestDetailResponse pullRequestDetail = pullRequestService.getPullRequestById(customUserDetail, repoId, prId);
        
        return aiWebClient.post()
                .uri("/ai/vector-db/store")
                .bodyValue(pullRequestDetail)
                .retrieve()
                .bodyToMono(Void.class)
                .timeout(Duration.ofMinutes(2))
                .doOnSuccess(result -> log.info("Vector DB 저장 완료 - PR ID: {}", pullRequestDetail.getId()))
                .doOnError(error -> log.error("Vector DB 저장 실패 - PR ID: {}", pullRequestDetail.getId(), error))
                .onErrorResume(error -> {
                    log.warn("Vector DB 저장 실패하였지만 계속 진행 - PR ID: {}", pullRequestDetail.getId());
                    return Mono.empty();
                });
    }
    
    private Mono<Void> validateUserPermissionAsync(Long userId, Long repoId) {
        return Mono.fromCallable(() -> {
                    userAccountService.validateUserPermission(userId, repoId);
                    return null;
                })
                .subscribeOn(Schedulers.boundedElastic())
                .then();
    }
    
    // 8. 캐시 저장을 비동기로 수행
    private Mono<Void> saveToCache(AiRequest request, AiResult result) {
        return Mono.fromRunnable(() -> {
                    try {
                        aiRedisRepository.saveAiInfo(request, result);
                        log.debug("AI 분석 결과 캐시 저장 완료");
                    } catch (Exception e) {
                        log.warn("캐시 저장 중 오류 발생", e);
                        throw new RuntimeException("캐시 저장 실패", e);
                    }
                })
                .subscribeOn(Schedulers.boundedElastic())  // I/O 스레드에서 실행
                .then();
    }
    
    // 9. 기본값 생성 메소드들 (각 API 실패 시 사용)
    private AiTitleResponse createDefaultTitleResponse() {
        return new AiTitleResponse("분석 중 오류 발생");
    }
    
    private AiSummaryResponse createDefaultSummaryResponse() {
        return new AiSummaryResponse("요약 정보를 생성할 수 없습니다.");
    }
    
    private AiReviewerResponse createDefaultReviewersResponse() {
        return new AiReviewerResponse(Collections.emptyList());
    }
    
    private AiPriorityResponse createDefaultPriorityResponse() {
        return AiPriorityResponse.createDefaultPriorityResponse();
    }
    
    private AiConventionResponse createDefaultConventionResponse() {
        return new AiConventionResponse("컨벤션 검사를 수행할 수 없습니다.");
    }
    
    // 10. 부분 실패 처리 개선
    private Mono<AiResult> handlePartialFailure(LocalDateTime startTime, Throwable error) {
        log.error("전체 분석 실패, 부분 결과 제공", error);
        
        return Mono.just(AiResult.builder()
                .title(createDefaultTitleResponse())
                .summary(createDefaultSummaryResponse())
                .reviewers(createDefaultReviewersResponse())
                .priority(createDefaultPriorityResponse())
                .conventions(createDefaultConventionResponse())
                .analysisTime(startTime)
                .hasErrors(true)  // 에러 플래그 추가
                .errorMessage(error.getMessage())
                .build());
    }
}
