package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.repository.AccountRepository;
import com.ssafy.ottereview.account.service.UserAccountService;
import com.ssafy.ottereview.branch.service.BranchService;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.repo.service.RepoService;
import com.ssafy.ottereview.webhook.dto.InstallationEventDto;
import com.ssafy.ottereview.webhook.dto.RepositoryEventDto;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@Service
@Slf4j
@RequiredArgsConstructor
public class InstallationEventService {

    private final ObjectMapper objectMapper;
    private final AccountRepository accountRepository;
    private final RepoRepository repoRepository;
    private final GithubApiClient githubApiClient;
    private final UserAccountService userAccountService;
    private final BranchService branchService;
    private final RepoService repoService;

    public void processInstallationEvent(String payload) {

        try {
            InstallationEventDto event = objectMapper.readValue(payload,
                    InstallationEventDto.class);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(event);
            log.debug("DTO로 받은 installation event: {}", formattedPayload);

            switch (event.getAction()) {
                case "created":
                    log.debug("Installation created event received");
                    break;

                case "deleted":
                    log.debug("Installation deleted event received");
                    handleInstallationDeleted(event);
                    break;

                case "updated":
                    log.debug("Installation updated event received");
                    break;

                default:
                    log.warn("Unhandled action: {}", event.getAction());
            }
        } catch (Exception e) {
            log.error("Error processing installation event", e);
        }
    }

    public void processInstallationRepositoriesEvent(String payload) {
        log.debug("Installation Repositories Event 프로세스 실행");

        try {
            RepositoryEventDto event = objectMapper.readValue(payload, RepositoryEventDto.class);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(event);
            log.debug("DTO로 받은 RepositoryEventDto event: {}", formattedPayload);

            switch (event.getAction()) {
                case "created":
                    log.debug("Repository created event received");
                    break;

                case "removed":
                    log.debug("Repository deleted event received");
                    handleRepositoryRemoved(event);
                    break;

                case "added":
                    log.debug("Repository added event recevied");
                    handleRepositoryAdded(event);
                    break;
                default:
                    log.warn("Unhandled action: {}", event.getAction());
            }
        } catch (Exception e) {
            log.error("Error processing installation event", e);
        }
    }

    private void handleInstallationDeleted(InstallationEventDto event) {
        accountRepository.deleteByGithubId(event.getInstallation()
                .getAccount()
                .getId());
    }

    private void handleRepositoryRemoved(RepositoryEventDto event) {
        for (RepositoryEventDto.RepositoryInfo repository : event.getRepositoriesRemoved()) {

            log.debug("삭제된 리포지토리 정보: {}", repository);
            repoRepository.deleteByRepoId(repository.getId());
        }
    }

    private void handleRepositoryAdded(RepositoryEventDto event) throws IOException {
        Account account = userAccountService.getAccountByInstallationId(
                event.getInstallation().getId());
        List<GHRepository> ghRepositoryList = githubApiClient.getRepositories(
                event.getInstallation().getId());
        for (GHRepository gr : ghRepositoryList) {
            log.debug("추가된 레포지토리 정보: {}", gr);
        }
        // repository , branch , pullRequest를 한번에 저장하는 로직이다.
        repoService.updateRepoList(ghRepositoryList, account);

    }
}
