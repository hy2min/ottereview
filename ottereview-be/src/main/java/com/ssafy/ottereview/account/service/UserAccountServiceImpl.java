package com.ssafy.ottereview.account.service;

import com.ssafy.ottereview.account.dto.AccountResponse;
import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.entity.UserAccount;
import com.ssafy.ottereview.account.repository.AccountRepository;
import com.ssafy.ottereview.account.repository.UserAccountRepository;
import com.ssafy.ottereview.githubapp.dto.GithubAccountResponse;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.user.dto.UserResponseDto;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
@Transactional
public class UserAccountServiceImpl implements UserAccountService {
    
    private final AccountRepository accountRepository;
    private final UserAccountRepository userAccountRepository;
    private final UserRepository userRepository;
    private final RepoRepository repoRepository;
    
    @Override
    public List<AccountResponse> getAccountsByUser(CustomUserDetail customUserDetail) {
        List<UserAccount> userAccounts = userAccountRepository.findAllByUser(customUserDetail.getUser());
        return userAccounts.stream()
                .map(UserAccount::getAccount)
                .map(this::convertToAccountResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public Account createAccount(GithubAccountResponse githubAccountResponse) {
        Account account = Account.builder()
                .installationId(githubAccountResponse.getInstallationId())
                .type(githubAccountResponse.getType())
                .name(githubAccountResponse.getName())
                .githubId(githubAccountResponse.getGithubId())
                .build();
        
        return accountRepository.save(account);
    }
    
    @Override
    public Account getAccountByInstallationId(Long installationId) {
        return accountRepository.findByInstallationId(installationId);
    }
    
    @Override
    public Repo validateUserPermission(Long userId, Long repoId) {
        
        User loginUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        Repo repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Repository not found with id: " + repoId));
        
        if (!userAccountRepository.existsByUserAndAccount(loginUser, repo.getAccount())) {
            throw new IllegalArgumentException("유저는 해당 레포지토리의 계정에 속하지 않습니다.");
        }
        
        return repo;
    }
    
    @Override
    public List<UserResponseDto> getUsersByAccount(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found with id: " + accountId));
        
        List<UserAccount> userAccountList = userAccountRepository.findAllByAccount(account);
        
        return userAccountList.stream()
                .map(UserAccount::getUser)
                .map(UserResponseDto::fromEntity)
                .toList();
    }

    @Override
    public void saveUserAndAccount(User user, Account account) {
        if(!userAccountRepository.existsByUserAndAccount(user,account)) {
            userAccountRepository.save(UserAccount.builder()
                    .account(account)
                    .user(user)
                    .build());
        }
    }

    private AccountResponse convertToAccountResponse(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getInstallationId(),
                account.getName(),
                account.getType()
        );
    }


}
