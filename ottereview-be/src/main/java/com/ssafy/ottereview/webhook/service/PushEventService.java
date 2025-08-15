package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.preparation.service.PreparationService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.exception.RepoErrorCode;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.webhook.controller.EventSendController;
import com.ssafy.ottereview.webhook.dto.PushEventDto;
import com.ssafy.ottereview.webhook.exception.WebhookErrorCode;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class PushEventService {
    
    private final ObjectMapper objectMapper;
    private final GithubApiClient githubApiClient;
    private final PreparationService prPreparationService;
    private final EventSendController eventSendController;
    private final RepoRepository repository;

    public void processPushEvent(String payload) {
        log.info("Push Event 프로세스 실행");
        try {
            JsonNode json = objectMapper.readTree(payload);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(json);

//            log.debug("전체 페이로드 출력:\n{}", formattedPayload);
            
            // Push 이벤트 기본 정보 추출
            PushEventDto pushInfo = extractPushEventInfo(json);

            eventSendController.push(pushInfo.getSender().getId(),"push", pushInfo);
            
        } catch (Exception e) {
            throw new BusinessException(WebhookErrorCode.WEBHOOK_UNSUPPORTED_ACTION);
        }
    }
    
    private PushEventDto extractPushEventInfo(JsonNode json) {
        String ref = json.path("ref")
                .asText();
        String branchName = ref.replace("refs/heads/", "");
        
        List<String> commitShas = new ArrayList<>();
        JsonNode commits = json.path("commits");
        for (JsonNode commit : commits) {
            commitShas.add(commit.path("id")
                    .asText());
        }

        Long repoId = json.path("repository").path("id").asLong();
        Repo repo = repository.findByRepoId(repoId)
                .orElseThrow(() ->
                        new BusinessException(RepoErrorCode.REPO_NOT_FOUND, "Repository not found with ID: " + repoId));

        return PushEventDto.builder()
                .ref(ref)
                .branchName(branchName)
                .repoFullName(json.path("repository")
                        .path("full_name")
                        .asText())
                .repoId(repo.getId())
                .repoGithubId(repo.getRepoId())
                .defaultBranch(json.path("repository")
                        .path("default_branch")
                        .asText())
                .pusherName(json.path("pusher")
                        .path("name")
                        .asText())
                .pusherEmail(json.path("pusher")
                        .path("email")
                        .asText())
                .isNewBranch(json.path("created")
                        .asBoolean())
                .isDeleted(json.path("deleted")
                        .asBoolean())
                .isForced(json.path("forced")
                        .asBoolean())
                .beforeSha(json.path("before")
                        .asText())
                .afterSha(json.path("after")
                        .asText())
                .commitShas(commitShas)
                .commitCount(commits.size())
                .installationId(json.path("installation")
                        .path("id")
                        .asLong())
                .build();
    }
}
