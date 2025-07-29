package com.ssafy.ottereview.githubapp.util;

import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.entity.UserAccount;
import com.ssafy.ottereview.account.repository.UserAccountRepository;
import com.ssafy.ottereview.account.service.AccountService;
import com.ssafy.ottereview.auth.dto.GithubUserDto;
import com.ssafy.ottereview.auth.service.AuthService;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.githubapp.dto.GithubAccountResponse;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.repo.service.RepoService;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHRepository;
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
    private final RepoRepository repoRepository;
    private final RepoService repoService;

    public void
    processInstallationWithOAuth(Long installationId, String code) {

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
        try {
            GitHub github = githubAppUtil.getGitHub(installationId);
            List<GHRepository> repositories = github.getInstallation()
                    .listRepositories()
                    .toList();

            // log 확인용
            for (GHRepository repo : repositories) {
                log.info("Repo ID: {}, Full Name: {}, Private: {}",
                        repo.getId(), repo.getFullName(), repo.isPrivate());
            }

            List<Repo> toCreate = repositories.stream()
                    .map(r -> {
                        return Repo.builder()
                                .repoId(r.getId())
                                .fullName(r.getFullName())
                                .isPrivate(r.isPrivate())
                                .account(newAccount)
                                .build();
                    } ).toList();
            if(!toCreate.isEmpty()){
                repoRepository.saveAll(toCreate);
            }
            log.info("save 성공");
        }catch(IOException e){
            e.printStackTrace();
        }
    }
    // process update 로직 추가
    public void processUpdatewithOAuth(Long installationId){
            Account account = accountService.getAccountByInstallationId(installationId);
            repoService.processSyncRepo(account,installationId);
    }
}
