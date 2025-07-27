package com.ssafy.ottereview.account.service;

import com.ssafy.ottereview.account.dto.AccountResponse;
import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.entity.UserAccount;
import com.ssafy.ottereview.account.repository.AccountRepository;
import com.ssafy.ottereview.account.repository.UserAccountRepository;
import com.ssafy.ottereview.github.client.GithubApiClient;
import com.ssafy.ottereview.github.dto.GithubAccountResponse;
import com.ssafy.ottereview.user.entity.User;
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
    public void createAccount(GithubAccountResponse githubAccountResponse, User user) {
        Account account = Account.builder()
                .installationId(githubAccountResponse.getInstallationId())
                .type(githubAccountResponse.getType())
                .name(githubAccountResponse.getName())
                .build();
        
        accountRepository.save(account);
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
