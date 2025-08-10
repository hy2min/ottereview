package com.ssafy.ottereview.account.service;

import com.ssafy.ottereview.account.dto.AccountResponse;
import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.githubapp.dto.GithubAccountResponse;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.user.dto.UserResponseDto;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.entity.User;
import java.util.List;


public interface UserAccountService {
    
    List<AccountResponse> getAccountsByUser(CustomUserDetail customUserDetail);
    
    Account createAccount(GithubAccountResponse githubAccountResponse);

    Account getAccountByInstallationId(Long installationId);
    
    Repo validateUserPermission(Long userId, Long repoId);

    List<UserResponseDto> getUsersByAccount(Long accountId);

    void saveUserAndAccount(User user , Account account);
 }
