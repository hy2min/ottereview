package com.ssafy.ottereview.githubapp.util;

import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.entity.UserAccount;
import com.ssafy.ottereview.account.repository.UserAccountRepository;
import com.ssafy.ottereview.account.service.AccountService;
import com.ssafy.ottereview.auth.dto.GithubUserDto;
import com.ssafy.ottereview.auth.service.AuthService;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.githubapp.dto.GithubAccountResponse;
import com.ssafy.ottereview.pullrequest.service.PullRequestService;
import com.ssafy.ottereview.repo.service.RepoService;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHAppInstallation;
import org.kohsuke.github.GHOrganization;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GHUser;
import org.kohsuke.github.GitHub;
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
    private final RepoService repoService;
    private final PullRequestService pullRequestService;

    public void processInstallationWithOAuth(Long installationId, String code) throws IOException {

        String accessToken = githubAppUtil.requestGithubAccessToken(code);

        GithubUserDto githubUserDto = authService.requestGithubUser(accessToken);

        User loginUser = userRepository.findByGithubEmail(githubUserDto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("등록된 사용자가 아닙니다."));

        // 2. Account 생성/조회
        GithubAccountResponse githubAccountResponse = githubApiClient.getAccount(installationId);
        Account newAccount = accountService.createAccount(githubAccountResponse);

        if(githubAccountResponse.getType().equals("Organization")){
            GHAppInstallation githubAppUtilInstallation = githubAppUtil.getInstallation(installationId);
            String orgName = githubApiClient.getOrgName(githubAppUtilInstallation);
            GitHub gitHub = githubAppUtil.getGitHub(installationId);
            GHOrganization organization = gitHub.getOrganization(orgName);
            List<GHUser> orgMembers = organization.listMembers().toList();
            log.info("Organization {} has {} members", orgName, orgMembers.size());
            for(GHUser user : orgMembers){
                if(user.getLogin().equals(loginUser.getGithubUsername())) continue;
                User u = User.builder()
                        .githubUsername(user.getLogin())
                        .githubEmail(user.getEmail())
                        .profileImageUrl(user.getAvatarUrl())
                        .userGrade("BASIC")
                        .rewardPoints(0)
                        .build();
                userRepository.save(u);
                userAccountRepository.save(UserAccount.builder()
                                .account(newAccount)
                                .user(u)
                                .build());
            }
        }

        // 3. 사용자-계정 매핑 생성
        UserAccount userAccount = UserAccount.builder()
                .user(loginUser)
                .account(newAccount)
                .build();

        userAccountRepository.save(userAccount);

        //5. repo리스트 db에 저장하는 메소드 (이미 저장된 것은 넘긴다)
        repoService.processSyncRepo(newAccount, installationId);
    }
}
