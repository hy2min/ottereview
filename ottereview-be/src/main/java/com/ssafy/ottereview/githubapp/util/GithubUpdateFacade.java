package com.ssafy.ottereview.githubapp.util;

import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.service.UserAccountService;
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

    private final UserAccountService userAccountService;
    private final RepoService repoService;

    // process update 로직 추가
    public void processUpdateWithOAuth(Long installationId) {

        Account account = userAccountService.getAccountByInstallationId(installationId);
        repoService.processSyncRepo(account, installationId);
    }
}
