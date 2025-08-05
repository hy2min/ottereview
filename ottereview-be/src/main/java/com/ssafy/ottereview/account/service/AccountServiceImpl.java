package com.ssafy.ottereview.account.service;

import com.ssafy.ottereview.account.dto.AccountResponse;
import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.entity.UserAccount;
import com.ssafy.ottereview.account.repository.AccountRepository;
import com.ssafy.ottereview.account.repository.UserAccountRepository;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.githubapp.dto.GithubAccountResponse;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
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
public class AccountServiceImpl implements AccountService {
    
    private final GithubApiClient githubApiClient;
    private final AccountRepository accountRepository;
    private final UserAccountRepository userAccountRepository;
    private final UserRepository userRepository;
    private final RepoRepository repoRepository;
    
    @Override
    public AccountResponse getGithubAccount() {
        GithubAccountResponse githubAccountResponse = githubApiClient.getAccount(77362016L);
        
        Account account = Account.builder()
                .installationId(githubAccountResponse.getInstallationId())
                .type(githubAccountResponse.getType())
                .name(githubAccountResponse.getName())
                .build();
        
        return convertToAccountResponse(account);
    }
    
    @Override
    public List<AccountResponse> getAccountsByUser(User user) {
        List<UserAccount> userAccounts = userAccountRepository.findAllByUser(user);
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
    public void createUserAccount(User user, Account account) {
        
        UserAccount userAccount = UserAccount.builder()
                .account(account)
                .user(user)
                .build();
        
        userAccountRepository.save(userAccount);
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
    
    private AccountResponse convertToAccountResponse(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getInstallationId(),
                account.getName(),
                account.getType()
        );
    }
}
