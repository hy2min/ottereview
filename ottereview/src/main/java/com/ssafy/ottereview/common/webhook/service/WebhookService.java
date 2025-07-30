package com.ssafy.ottereview.common.webhook.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Transactional
@Service
@Slf4j
public class WebhookService {

    private final ObjectMapper objectMapper;

    public void handlePushEvent(String payload) {
        try {
            JsonNode json = objectMapper.readTree(payload);

            // 브랜치 정보
            String ref = json.path("ref").asText(); // "refs/heads/main"
            String branch = ref.replace("refs/heads/", ""); // "main"

            // 커밋 정보
            String beforeSha = json.path("before").asText(); // 이전 커밋 SHA
            String afterSha = json.path("after").asText();   // 새로운 커밋 SHA

            // Push한 사람
            String pusherName = json.path("pusher").path("name").asText();
            String pusherEmail = json.path("pusher").path("email").asText();

            // 비즈니스 로직 처리
//            processPushEvent(repoName, pusher, ref);

        } catch (Exception e) {
            log.error("Error processing push event", e);
        }
    }

    public void handlePullRequestEvent(String payload) {
        try {
            JsonNode json = objectMapper.readTree(payload);

            String action = json.path("action").asText();
            String repoName = json.path("repository").path("full_name").asText();
            int prNumber = json.path("pull_request").path("number").asInt();
            String title = json.path("pull_request").path("title").asText();

            log.info("PR {} - {} in {}: {}", action, prNumber, repoName, title);

            // PR 이벤트 처리
//            processPullRequestEvent(action, repoName, prNumber, json);

        } catch (Exception e) {
            log.error("Error processing pull request event", e);
        }
    }
}
