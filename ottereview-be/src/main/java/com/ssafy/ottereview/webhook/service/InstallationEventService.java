package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.repository.AccountRepository;
import com.ssafy.ottereview.account.service.UserAccountService;
import com.ssafy.ottereview.branch.entity.Branch;
import com.ssafy.ottereview.branch.repository.BranchRepository;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.repo.service.RepoService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.webhook.controller.EventSendController;
import com.ssafy.ottereview.webhook.dto.BranchEventDto;
import com.ssafy.ottereview.webhook.dto.InstallationEventDto;
import com.ssafy.ottereview.webhook.dto.RepositoryEventDto;
import com.ssafy.ottereview.webhook.exception.WebhookErrorCode;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    private final BranchRepository branchRepository;
    private final RepoService repoService;
    private final EventSendController eventSendController;

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
            throw new BusinessException(WebhookErrorCode.WEBHOOK_UNSUPPORTED_ACTION);
        }
    }

    public void processInstallationRepositoriesEvent(User user, String payload) {
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
                    log.debug("Repository added event received");
                    handleRepositoryAdded(user,event);
                    break;
                default:
                    log.warn("Unhandled action: {}", event.getAction());
            }
        } catch (Exception e) {
            log.error("Error processing installation event", e);
        }
    }

    public void processAddBranchesEvent(String payload) {
        log.debug("Added Branch Event 프로세스 실행");
        try {
            BranchEventDto event = objectMapper.readValue(payload, BranchEventDto.class);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(event);
            log.debug("DTO로 받은 BranchEventDto event: {}", formattedPayload);

            switch (event.getRefType()) {
                case "branch":
                    log.debug("Branch added event received");
                    handleBranchAdded(event);
                    break;

                case "tag":
                    log.debug("tag added event received");
                    break;
            }

        } catch (Exception e) {
            log.error("Error Add Branch processing event", e);
        }
    }

    public void processDeleteBranchesEvent(String payload) {
        log.debug("Branch delete Event 프로세스 실행");
        try {
            BranchEventDto event = objectMapper.readValue(payload, BranchEventDto.class);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(event);
            log.debug("DTO로 받은 BranchEventDto event: {}", formattedPayload);
            switch (event.getRefType()) {
                case "branch":
                    log.debug("Branch deleted event received");
                    handleBranchDeleted(event);
                    break;

                case "tag":
                    log.debug("tag deleted event received");
                    break;
            }

        } catch (Exception e) {
            log.error("Error Add Branch processing event", e);
        }
    }

    private void handleBranchDeleted(BranchEventDto event) {
        Repo repo = repoRepository.findByRepoId(event.getRepository().getRepoId()).orElseThrow();
        branchRepository.deleteByNameAndRepo(event.getName(),repo);
    }

    // branch를 새로 만들면 주는 webhook을 다루는 로직이다.
    private void handleBranchAdded(BranchEventDto event) {
        Repo repo = repoRepository.findByRepoId(event.getRepository().getRepoId()).orElseThrow();
        branchRepository.save(Branch.builder()
                .name(event.getName())
                .repo(repo)
                .minApproveCnt(0)
                .build());

    }
    // B

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

    private void handleRepositoryAdded(User user, RepositoryEventDto event) throws IOException {
        Account account = userAccountService.getAccountByInstallationId(
                event.getInstallation().getId());
        List<GHRepository> ghRepositoryList = githubApiClient.getRepositories(
                event.getInstallation().getId());
        for (GHRepository gr : ghRepositoryList) {
            log.debug("추가된 레포지토리 정보: {}", gr);
        }
        // repository , branch , pullRequest를 한번에 저장하는 로직이다.
        repoService.updateRepoList(ghRepositoryList, account);
        eventSendController.push(user.getId(),"update", "update");
    }


}
