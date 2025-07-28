package com.ssafy.ottereview.githubapp.util;

import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.entity.UserAccount;
import com.ssafy.ottereview.account.repository.UserAccountRepository;
import com.ssafy.ottereview.account.service.AccountService;
import com.ssafy.ottereview.auth.dto.GithubUserDto;
import com.ssafy.ottereview.auth.service.AuthService;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.githubapp.dto.GithubAccountResponse;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class GithubInstallationFacade {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final GithubApiClient githubApiClient;
    private final AccountService accountService;
    private final UserAccountRepository userAccountRepository;
    private final GithubAppUtil githubAppUtil;

    public void processInstallationWithOAuth(Long installationId, String code) {

        // code -> github app oauth AccessToken 가져오기
        String accessToken = githubAppUtil.requestGithubAccessToken(code);
        log.debug("accessToken 성공: {} ", accessToken);
        // 사용자 정보 가져오기
        log.debug("사용자 정보 가져오기 로직 실행");
        GithubUserDto githubUserDto = authService.requestGithubUser(accessToken);

        User loginUser = userRepository.findByGithubEmail(githubUserDto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("등록된 사용자가 아닙니다."));

        // 2. Account 생성/조회
        GithubAccountResponse githubAccountResponse = githubApiClient.getAccount(installationId);
        Account newAccount = accountService.createAccount(githubAccountResponse);

        // 3. 사용자-계정 매핑 생성
        UserAccount userAccount = UserAccount.builder()
                .user(loginUser)
                .account(newAccount)
                .build();

        userAccountRepository.save(userAccount);

        // 4. 저장소 목록 생성
    }
}
