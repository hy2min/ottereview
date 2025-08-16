package com.ssafy.ottereview.webhook.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.common.annotation.MvcController;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.webhook.exception.WebhookErrorCode;
import com.ssafy.ottereview.webhook.service.BranchProtectionEventService;
import com.ssafy.ottereview.webhook.service.InstallationEventService;
import com.ssafy.ottereview.webhook.service.PullRequestEventService;
import com.ssafy.ottereview.webhook.service.PushEventService;
import com.ssafy.ottereview.webhook.service.RepoEventService;
import com.ssafy.ottereview.webhook.service.ReviewCommentEventService;
import com.ssafy.ottereview.webhook.service.ReviewEventService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhook")
@RequiredArgsConstructor
@Slf4j
@MvcController
public class GithubWebhookController {

    private final PushEventService pushEventService;
    private final InstallationEventService installationEventService;
    private final PullRequestEventService pullRequestEventService;
    private final ReviewEventService reviewEventService;
    private final ReviewCommentEventService reviewCommentEventService;
    private final BranchProtectionEventService branchProtectionEventService;
    private final RepoEventService repoEventService;
    private final ObjectMapper objectMapper;

    @Hidden
    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-GitHub-Event") String event,
            @RequestHeader("X-GitHub-Delivery") String delivery,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature) {
        try {
            JsonNode jsonNode = objectMapper.readTree(payload);
            String action = jsonNode.path("action").asText();
            log.debug("[웹훅 이벤트 수신] 이벤트: {}, Action: {}", event, action);
            
        } catch (Exception e) {
            log.error("Error parsing payload: {}", e.getMessage());
        }
        // 이벤트별 처리
        switch (event) {
            case "push":
                pushEventService.processPushEvent(payload);
                break;

            case "pull_request":
                pullRequestEventService.processPullRequestEvent(payload);
                break;

            case "pull_request_review":
                reviewEventService.processReviewEvent(payload);
                break;

            case "pull_request_review_comment":
                reviewCommentEventService.processReviewCommentEvent(payload);
                break;

            case "installation":
                installationEventService.processInstallationEvent(payload);
                break;

            case "installation_repositories":
                installationEventService.processInstallationRepositoriesEvent(payload);
                break;

            case "create":
                installationEventService.processAddBranchesEvent(payload);
                break;

            case "delete":
                installationEventService.processDeleteBranchesEvent(payload);
                break;

            case "branch_protection_rule":
                branchProtectionEventService.processBranchProtection(payload);
                break;

            case "repository":
                repoEventService.processRepo(payload);
                break;

            default:
                throw new BusinessException(WebhookErrorCode.WEBHOOK_UNSUPPORTED_EVENT);
        }

        return ResponseEntity.ok("OK");
    }
}
