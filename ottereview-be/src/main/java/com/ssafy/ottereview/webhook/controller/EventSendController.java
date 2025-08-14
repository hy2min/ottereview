package com.ssafy.ottereview.webhook.controller;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/sse")
@Slf4j
public class EventSendController {
    // String으로 받은 이유는 update , create 이런식으로 client를 상황에 따라 나누기 위해서
    private final Map<Long , SseEmitter> clients = new ConcurrentHashMap<>();

    @GetMapping("/make-clients")
    public SseEmitter makeClients(@RequestParam(name = "user-id") Long userId){
        SseEmitter emitter = new SseEmitter(0L); // 무한대(프록시 타임아웃은 따로)
        clients.put(userId, emitter);
        emitter.onCompletion(()-> clients.remove(userId));
        emitter.onTimeout(() -> clients.remove(userId));
        return emitter;
    }

    public void push(Long userId, String action , Object payload){
        log.info("SSE 전송 시도: action={}, 클라이언트 수={}", action, clients.size());
        SseEmitter e = clients.get(userId);
        if( e != null) {
            try {
                e.send(SseEmitter.event().name(action).data(payload));
                log.info("SSE 전송 성공: action={}", action);
            } catch (IOException ex) {
                log.error("SSE 전송 실패: action={}, error={}", action, ex.getMessage());
                clients.remove(userId);
            }
        } else {
            log.warn("SSE 클라이언트 없음: action={}", action);
        }
    }
}
