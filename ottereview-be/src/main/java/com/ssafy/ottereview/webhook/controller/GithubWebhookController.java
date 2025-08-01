package com.ssafy.ottereview.webhook.controller;

import com.ssafy.ottereview.webhook.service.PushEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/webhook")
@RequiredArgsConstructor
@Slf4j
public class GithubWebhookController {
    
    private final PushEventService pushEventService;
    
    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-GitHub-Event") String event,
            @RequestHeader("X-GitHub-Delivery") String delivery,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature) {
        
        log.info("[DEBUG] 깃헙 웹훅 이벤트 - Event: {}, Delivery: {}", event, delivery);
        // 이벤트별 처리
        switch (event) {
            case "push":
                pushEventService.processPushEvent(payload);
                break;
            case "pull_request":
                log.info("Handling pull request event");
                break;
            default:
                log.info("Unhandled event type: {}", event);
        }
        
        return ResponseEntity.ok("OK");
    }
}
