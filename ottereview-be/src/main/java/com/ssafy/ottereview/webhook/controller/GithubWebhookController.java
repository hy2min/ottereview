package com.ssafy.ottereview.webhook.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.webhook.service.InstallationEventService;
import com.ssafy.ottereview.webhook.service.PullRequestEventService;
import com.ssafy.ottereview.webhook.service.PushEventService;
import com.ssafy.ottereview.webhook.service.ReviewCommentEventService;
import com.ssafy.ottereview.webhook.service.ReviewEventService;
import io.swagger.v3.oas.annotations.Hidden;
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
    private final InstallationEventService installationEventService;
    private final PullRequestEventService pullRequestEventService;
    private final ReviewEventService reviewEventService;
    private final ReviewCommentEventService reviewCommentEventService;
    private final ObjectMapper objectMapper;

    @Hidden
    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-GitHub-Event") String event,
            @RequestHeader("X-GitHub-Delivery") String delivery,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature) {

        log.info("[웹훅 이벤트 수신] 이벤트: {}, delivery: {}", event, delivery);
        
        // 이벤트별 처리
        switch (event) {
            case "push":
                pushEventService.processPushEvent(payload);
                break;
            
            case "pull_request":
                log.info("Handling pull request event");
                pullRequestEventService.processPullRequestEvent(payload);
                break;
            
            case "pull_request_review":
                log.info("Handling pull request review event");
                reviewEventService.processReviewEvent(payload);
                break;
            
            case "pull_request_review_comment":
                log.info("Handling pull request review event");
                reviewCommentEventService.processReviewCommentEvent(payload);
                break;
            
            case "installation":
                log.info("Handling installation event");
                installationEventService.processInstallationEvent(payload);
                break;
                
            case "installation_repositories":
                log.info("Handling installation repositories event");
                installationEventService.processInstallationRepositoriesEvent(payload);
                break;
                
            default:
                log.info("Unhandled event type: {}", event);
        }
        
        return ResponseEntity.ok("OK");
    }
}
