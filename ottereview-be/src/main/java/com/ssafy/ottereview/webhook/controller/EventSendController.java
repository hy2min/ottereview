package com.ssafy.ottereview.webhook.controller;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/sse")
public class EventSendController {
    // String으로 받은 이유는 update , create 이런식으로 client를 상황에 따라 나누기 위해서
    private final Map<String , SseEmitter> clients = new ConcurrentHashMap<>();

    @GetMapping("/make-clients")
    public SseEmitter makeClients(@RequestParam String action){
        SseEmitter emitter = new SseEmitter(0L); // 무한대(프록시 타임아웃은 따로)
        clients.put(action, emitter);
        emitter.onCompletion(()-> clients.remove(action));
        emitter.onTimeout(() -> clients.remove(action));
        return emitter;
    }

    public void push(String action , String payload){
        SseEmitter e = clients.get(action);
        if( e!= null) try {e.send(SseEmitter.event().name("update"));} catch (
                IOException ex) {
            clients.remove(action);
        }
    }
}
