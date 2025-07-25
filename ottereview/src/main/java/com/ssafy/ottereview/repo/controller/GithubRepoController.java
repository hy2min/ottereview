package com.ssafy.ottereview.repo.controller;

import com.ssafy.ottereview.Githubapp.utils.InstallationTokenService;
import com.ssafy.ottereview.repo.dto.RepoCreateRequest;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.service.RepoService;
import com.ssafy.ottereview.repo.service.RepoServiceImpl;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

@RestController
@RequestMapping("/api/github/repository")
@RequiredArgsConstructor
public class GithubRepoController {

    private final InstallationTokenService installationTokenService;
    private final RepoServiceImpl repoService;
    /**
     * GitHub App 설치 페이지로 사용자를 리다이렉션합니다. 이 API를 호출하면 GitHub의 설치 페이지로 이동하여 앱을 설치할 수 있습니다. 예시 URL:
     * http://localhost:8080/install-github-app
     *
     * @param state (선택 사항) OAuth2 인증의 'state' 파라미터와 유사하게 사용될 수 있는 임의의 상태 값. 설치 후 콜백 시 다시 전달됩니다.
     * @return GitHub App 설치 페이지로의 리다이렉션 뷰.
     */
    @GetMapping("/install-github-app")
    public RedirectView redirectToGitHubAppInstallation(@RequestParam(required = false) String state) {
        // GitHub App 설치 URL 형식은 'https://github.com/apps/{your-app-slug}/installations/new' 입니다.
        // {your-app-slug}는 GitHub App의 "Public page" URL에서 확인할 수 있는 앱의 간결한 이름입니다.
        // 앱 이름(slug) 대신 App ID를 사용하는 것도 가능합니다.
        String installationUrl = "https://github.com/apps/appapitest/installations/new"; // 여기에 실제 앱 슬러그를 입력하세요.
        // 예시: "https://github.com/apps/my-cool-github-app/installations/new"
        // 또는 App ID를 사용하는 경우 (덜 일반적이지만 가능):
        // String installationUrl = "https://github.com/apps/" + githubAppId + "/installations/new";

        if (state != null && !state.isEmpty()) {
            installationUrl += "?state=" + state;
        }

        System.out.println("Redirecting to GitHub App Installation URL: " + installationUrl);
        return new RedirectView(installationUrl);
    }

    /**
     * GitHub App 설치 완료 후 콜백을 받는 API입니다. 이 URL은 GitHub App 설정의 "Setup URL" 또는 "Installation callback URL" 필드에 등록해야 합니다. 이
     * API를 통해 설치 ID (installation_id)를 얻고, 이를 데이터베이스에 저장하여 향후 API 호출에 사용해야 합니다.
     *
     * @param installationId 앱이 설치된 특정 GitHub 계정/조직/레포지토리를 식별하는 고유 ID.
     * @param setupAction    (선택 사항) 설치(install) 또는 업데이트(update)와 같은 설치 액션.
     * @return 설치 완료 메시지 또는 리디렉션.
     */

    @GetMapping("/github-app/installation/callback") // <-- GET 요청 처리를 위한 별도의 핸들러
    public ResponseEntity<?> githubAppInstallationCallbackGet(
            @RequestParam("installation_id") long installationId, // GET 요청 시 필수 파라미터
            @RequestParam(value = "setup_action", required = false) String setupAction, // GET 요청 시 선택적 파라미터
            @RequestParam(value = "continue", required = false) String continueParam // 'continue' 파라미터도 받도록 추가
    ) throws Exception {
        System.out.println("GitHub App 설치 콜백 받음! (GET 요청)");
        System.out.println("Installation ID (from Param): " + installationId);
        System.out.println("Setup Action (from Param): " + setupAction);
        if (continueParam != null) {
            System.out.println("Continue Param: " + continueParam);
        }

        GitHub github = installationTokenService.generateGitHubByInstallationToken(installationId);

        // installationId에서 허용한 레포지토리 리스트들을 뽑는 코드이다.
        List<GHRepository> repositories = github.getInstallation().listRepositories().toList();

        // 따로 repo생성 dto로 repositories에서 owner 와 reponame 과 private여부 3개만 필요하니 따로 객체를 둬서 list로 뽑았다.
        List<RepoCreateRequest> repoName = repositories.stream()
                .map(githubRepo -> {
                    String[] parts = githubRepo.getFullName().split("/",2);
                    String owner = parts.length > 0 ? parts[0] : "";
                    String name = parts.length > 1 ? parts[1] : "";
                    return RepoCreateRequest.builder()
                            .githubOwnerUsername(owner)
                            .githubRepoName(name)
                            .isPrivate(githubRepo.isPrivate())
                            .installationId(installationId)
                            .build();
                })
                .toList();

        // 사용자 id를 기준으로 우리 db에 등록된 repo list를 가져와서 원래 등록된 repo인지 여부를 확인을하고 아니면 db에 저장하는 것으로 진행한다.
        // hashSet을 써서 O( N + M ) 시간복잡도를 가지게 구현하였다.
        List<RepoCreateRequest> repos = repoService.getReposByUserId(1L)
                .stream().map( githubRepo -> {
                            return RepoCreateRequest.builder()
                                    .githubRepoName(githubRepo.getGithubRepoName())
                                    .githubOwnerUsername(githubRepo.getGithubOwnerUsername())
                                    .isPrivate(githubRepo.isPrivate())
                                    .build();
                        }).toList();

        HashSet<RepoCreateRequest> repoHashSet = new HashSet<>(repos);
        for(RepoCreateRequest repo : repoName){
            if(!repoHashSet.contains(repo)){
                repoService.createRepo(repo);
            }
        }

        List<RepoResponse> repo = repoService.getReposByUserId(1L);
        return ResponseEntity.ok(repo);
    }


}
