package com.ssafy.ottereview.account.service;

import com.ssafy.ottereview.account.dto.AccountResponse;
import com.ssafy.ottereview.github.dto.GithubAccountResponse;
import com.ssafy.ottereview.user.entity.User;
import java.util.List;


public interface AccountService {
    
    AccountResponse getGithubAccount();
    
    List<AccountResponse> getAccountsByUser(User user);
    
    void createAccount(GithubAccountResponse githubAccountResponse, User user);
    
}
