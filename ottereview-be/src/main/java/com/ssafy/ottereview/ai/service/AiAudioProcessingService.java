package com.ssafy.ottereview.ai.service;

import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

public interface AiAudioProcessingService {
    Mono<String> processAudioFile(MultipartFile audioFile);
}
