package com.ssafy.ottereview.githubapp.util;

import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.service.UserAccountService;
import com.ssafy.ottereview.auth.dto.GithubUserDto;
import com.ssafy.ottereview.auth.service.AuthService;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.githubapp.dto.GithubAccountResponse;
import com.ssafy.ottereview.githubapp.exception.GithubAppErrorCode;
import com.ssafy.ottereview.repo.service.RepoService;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.exception.UserErrorCode;
import com.ssafy.ottereview.user.repository.UserRepository;
import com.ssafy.ottereview.user.service.UserService;
import java.io.IOException;
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
    private final UserAccountService userAccountService;
    private final GithubAppUtil githubAppUtil;
    private final RepoService repoService;
    private final UserService userService;

    public void processInstallationWithOAuth(Long installationId, String code) {

        String accessToken = githubAppUtil.requestGithubAccessToken(code);

        GithubUserDto githubUserDto = authService.requestGithubUser(accessToken);

        User loginUser = userRepository.findByGithubEmail(githubUserDto.getEmail())
                .orElseThrow(() -> new BusinessException(UserErrorCode.USER_NOT_FOUND));

        // 2. Account 생성/조회
        GithubAccountResponse githubAccountResponse = githubApiClient.getAccount(installationId);
        Account newAccount = userAccountService.createAccount(githubAccountResponse);

        if (githubAccountResponse.getType()
                .equals("Organization")) {
            //3. Organization 일때 User 저장 및 Account , UserAccount에 저장
            try {
                userService.getOrganizationMember(installationId, newAccount);
            } catch (IOException e) {
                throw new BusinessException(GithubAppErrorCode.GITHUB_APP_ORGANIZATION_MEMBER_NOT_FOUND);
            }
        } else {
            // 4. 개인 일때 존재하지 않은 UserAccount일 경우 UserAccount에 저장해주는 로직
            userAccountService.saveUserAndAccount(loginUser, newAccount);
        }

        //5. repo리스트 db에 저장하는 메소드 (이미 저장된 것은 넘긴다)
        repoService.processSyncRepo(newAccount, installationId);
    }
}
