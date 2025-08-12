package com.ssafy.ottereview.ai.service;

import com.ssafy.ottereview.ai.dto.response.AiConventionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiAudioProcessingServiceImpl implements AiAudioProcessingService {

    private final WebClient aiWebClient;

    @Override
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
}
