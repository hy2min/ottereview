package com.ssafy.ottereview.githubapp.util;

import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.service.AccountService;
import com.ssafy.ottereview.pullrequest.service.PullRequestService;
import com.ssafy.ottereview.repo.service.RepoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class GithubUpdateFacade {

    private final AccountService accountService;
    private final RepoService repoService;
    private final PullRequestService pullRequestService;

    // process update 로직 추가
    public void processUpdateWithOAuth(Long installationId) {

        Account account = accountService.getAccountByInstallationId(installationId);
        repoService.processSyncRepo(account, installationId);
    }
}
