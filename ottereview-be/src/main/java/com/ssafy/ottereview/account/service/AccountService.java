package com.ssafy.ottereview.account.service;

import com.ssafy.ottereview.account.dto.AccountResponse;
import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.githubapp.dto.GithubAccountResponse;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.entity.User;
import java.util.List;


public interface AccountService {
    
    AccountResponse getGithubAccount();
    
    List<AccountResponse> getAccountsByUser(User user);
    
    Account createAccount(GithubAccountResponse githubAccountResponse);
    
    void createUserAccount(User user, Account account);

    Account getAccountByInstallationId(Long installationId);
    
    Repo validateUserPermission(Long userId, Long repoId);
}
