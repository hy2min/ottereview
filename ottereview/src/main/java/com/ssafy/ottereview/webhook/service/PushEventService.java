package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.webhook.dto.PushEventInfo;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class PushEventService {
    
    private final ObjectMapper objectMapper;
    private final GithubApiClient githubApiClient;
    private final PullRequestPreparationService prPreparationService;
    
    public void processPushEvent(String payload) {
        log.info("Push Event 프로세스 실행");
        try {
            JsonNode json = objectMapper.readTree(payload);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(json);

//            log.debug("전체 페이로드 출력:\n{}", formattedPayload);
            
            // Push 이벤트 기본 정보 추출
            PushEventInfo pushInfo = extractPushEventInfo(json);
            
            String formattedPushInfo = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(pushInfo);
            
            log.debug("PushEventInfo 정보 출력:\n{}", formattedPushInfo);
            
            // PR 생성 조건 확인
//            if (shouldCreatePR(pushInfo)) {
            // 상세 정보 수집 및 PR 준비
            prPreparationService.preparePullRequestCreation(pushInfo);
//            }
        
        } catch (Exception e) {
            log.error("Error processing push event", e);
        }
    }
    
    private PushEventInfo extractPushEventInfo(JsonNode json) {
        String ref = json.path("ref")
                .asText();
        String branchName = ref.replace("refs/heads/", "");
        
        List<String> commitShas = new ArrayList<>();
        JsonNode commits = json.path("commits");
        for (JsonNode commit : commits) {
            commitShas.add(commit.path("id")
                    .asText());
        }
        
        return PushEventInfo.builder()
                .ref(ref)
                .branchName(branchName)
                .repoFullName(json.path("repository")
                        .path("full_name")
                        .asText())
                .repoId(json.path("repository")
                        .path("id")
                        .asLong())
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
    
    private boolean shouldCreatePR(PushEventInfo pushInfo) {
        // 삭제된 브랜치 제외
        if (pushInfo.isDeleted()) {
            log.debug("브랜치가 삭제된 경우, PR 생성하지 않음");
            return false;
        }
        
        // 기본 브랜치 제외
        if (pushInfo.getBranchName()
                .equals(pushInfo.getDefaultBranch())) {
            log.debug("기본 브랜치로 푸시된 경우, PR 생성하지 않음");
            return false;
        }
        
        // 이미 PR이 존재하는지 확인
        if (githubApiClient.pullRequestExists(pushInfo.getInstallationId(), pushInfo.getRepoFullName(), pushInfo.getBranchName())) {
            log.info("PR already exists for branch: {}", pushInfo.getBranchName());
            return false;
        }
        
        return true;
    }
}
