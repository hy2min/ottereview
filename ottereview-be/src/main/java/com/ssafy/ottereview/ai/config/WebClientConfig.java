package com.ssafy.ottereview.ai.config;

import com.ssafy.ottereview.ai.exception.AiApiException;
import io.netty.channel.ChannelOption;
import io.netty.channel.ConnectTimeoutException;
import io.netty.handler.timeout.ReadTimeoutException;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.util.retry.Retry;

@Slf4j
@Configuration
public class WebClientConfig {

    @Value("${ai.server.url}")
    private String baseUrl;

    @Bean("aiWebClient")
    public WebClient webClient() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000)     // 10초
                .responseTimeout(Duration.ofMinutes(3))                   // 3분 (AI 응답 대기)
                .doOnConnected(conn ->
                        conn.addHandlerLast(new ReadTimeoutHandler(180, TimeUnit.SECONDS))
                                .addHandlerLast(new WriteTimeoutHandler(60, TimeUnit.SECONDS))
                );

        return WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .defaultHeaders(headers -> {
                    headers.set("Content-Type", "application/json");
                    headers.set("Accept", "application/json");
                    headers.set("User-Agent", "ottereview/1.0");
                })
                .codecs(configurer ->
                        configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))  // 10MB
                .filter(loggingFilter())
                .filter(retryFilter())
                .filter(errorHandlingFilter())
                .build();
    }

    // 로깅 필터
    private ExchangeFilterFunction loggingFilter() {
        return ExchangeFilterFunction.ofRequestProcessor(request -> {
            log.debug("AI API 요청: {} {}", request.method(), request.url().getPath());
            return Mono.just(request);
        });
    }

    // 재시도 필터 (AI API는 간헐적으로 실패할 수 있음)
    private ExchangeFilterFunction retryFilter() {
        return (request, next) -> {
            return next.exchange(request)
                    .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                            .filter(throwable ->
                                    throwable instanceof ConnectTimeoutException ||
                                            throwable instanceof ReadTimeoutException ||
                                            (throwable instanceof WebClientResponseException &&
                                                    ((WebClientResponseException) throwable).getStatusCode().is5xxServerError())
                            )
                            .doBeforeRetry(retrySignal ->
                                    log.warn("AI API 재시도 {}: {}", retrySignal.totalRetries() + 1, request.url().getPath()))
                    );
        };
    }

    // 에러 처리 필터
    private ExchangeFilterFunction errorHandlingFilter() {
        return ExchangeFilterFunction.ofResponseProcessor(response -> {
            if (response.statusCode().is4xxClientError()) {
                return response.bodyToMono(String.class)
                        .flatMap(errorBody -> {
                            log.error("AI API Client Error [{}]: {}", response.statusCode(), errorBody);
                            return Mono.error(new AiApiException("AI API 클라이언트 오류: " + errorBody,
                                    response.statusCode()));
                        });
            }

            if (response.statusCode().is5xxServerError()) {
                return response.bodyToMono(String.class)
                        .flatMap(errorBody -> {
                            log.error("AI API Server Error [{}]: {}", response.statusCode(), errorBody);
                            return Mono.error(new AiApiException("AI API 서버 오류: " + errorBody,
                                    response.statusCode()));
                        });
            }

            return Mono.just(response);
        });
    }
}
