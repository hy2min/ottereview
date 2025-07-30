package com.ssafy.ottereview.common.webhook.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.common.webhook.dto.PushEventInfo;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
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
        try {
            JsonNode json = objectMapper.readTree(payload);

            // Push 이벤트 기본 정보 추출
            PushEventInfo pushInfo = extractPushEventInfo(json);

            log.info("Processing push event - Branch: {}, Repo: {}, Commits: {}",
                    pushInfo.getBranchName(), pushInfo.getRepoFullName(), pushInfo.getCommitCount());

            // PR 생성 조건 확인
            if (shouldCreatePR(pushInfo)) {
                // 상세 정보 수집 및 PR 준비
                prPreparationService.preparePullRequestCreation(pushInfo);
            }

        } catch (Exception e) {
            log.error("Error processing push event", e);
        }
    }

    private PushEventInfo extractPushEventInfo(JsonNode json) {
        String ref = json.path("ref").asText();
        String branchName = ref.replace("refs/heads/", "");

        List<String> commitShas = new ArrayList<>();
        JsonNode commits = json.path("commits");
        for (JsonNode commit : commits) {
            commitShas.add(commit.path("id").asText());
        }

        return PushEventInfo.builder()
                .ref(ref)
                .branchName(branchName)
                .repoFullName(json.path("repository").path("full_name").asText())
                .repoId(json.path("repository").path("id").asLong())
                .defaultBranch(json.path("repository").path("default_branch").asText())
                .pusherName(json.path("pusher").path("name").asText())
                .pusherEmail(json.path("pusher").path("email").asText())
                .isNewBranch(json.path("created").asBoolean())
                .isDeleted(json.path("deleted").asBoolean())
                .isForced(json.path("forced").asBoolean())
                .beforeSha(json.path("before").asText())
                .afterSha(json.path("after").asText())
                .commitShas(commitShas)
                .commitCount(commits.size())
                .build();
    }

    private boolean shouldCreatePR(PushEventInfo pushInfo) {
        // 삭제된 브랜치 제외
        if (pushInfo.isDeleted()) {
            return false;
        }

        // 기본 브랜치 제외
        if (pushInfo.getBranchName().equals(pushInfo.getDefaultBranch())) {
            return false;
        }

        // 브랜치 패턴 확인
        if (!matchesBranchPattern(pushInfo.getBranchName())) {
            return false;
        }

        // 이미 PR이 존재하는지 확인
        if (githubApiClient.pullRequestExists(pushInfo.getRepoId(), pushInfo.getRepoFullName(), pushInfo.getBranchName())) {
            log.info("PR already exists for branch: {}", pushInfo.getBranchName());
            return false;
        }

        return true;
    }

    private boolean matchesBranchPattern(String branchName) {
        return branchName.startsWith("feature/") ||
                branchName.startsWith("bugfix/") ||
                branchName.startsWith("hotfix/");
    }
}
