package com.ssafy.ottereview.githubapp.controller;

import com.ssafy.ottereview.githubapp.util.GithubInstallationFacade;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Slf4j
@RequiredArgsConstructor
@Controller
public class GithubCallbackController {
    
    private final GithubInstallationFacade githubInstallationFacade;
    
    @GetMapping("/")
    public String index() {
        return "index";
    }
    
    /**
     * GitHub App 설치 완료 후 콜백을 받는 API입니다. 이 URL은 GitHub App 설정의 "Setup URL" 또는 "Installation callback URL" 필드에 등록해야 합니다. 이 API를 통해 설치 ID (installation_id)를 얻고, 이를 데이터베이스에 저장하여 향후 API 호출에 사용해야 합니다.
     *
     * @param installationId 앱이 설치된 특정 GitHub 계정/조직/레포지토리를 식별하는 고유 ID.
     * @return 설치 완료 메시지 또는 리디렉션.
     */
    @GetMapping("/github-app/installation/callback") // <-- GET 요청 처리를 위한 별도의 핸들러
    public ResponseEntity<Void> githubAppInstallationCallbackGet(
            @RequestParam("installation_id") long installationId, // GET 요청 시 필수 파라미터
            @RequestParam("code") String code,
            @RequestParam("setup_action") String setupAction
    ) {
        try {
            log.debug("GitHub App Installation Callback GET 요청: installationId={}, code={}",
                    installationId, code);

            if(setupAction.equals("install")) {
                log.debug("install 로직 실행");
                githubInstallationFacade.processInstallationWithOAuth(installationId, code);
            }
            
            // 🎯 리디렉션할 프론트엔드 URI
            log.debug("리다이렉트 URL 생성");
            URI redirectUri = URI.create("http://localhost:8080/"); // 또는 환경 변수로 관리

            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(redirectUri)
                    .build();

        } catch (Exception e) {
            log.error("Unexpected error during GitHub installation", e);
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
    }
}

//        log.debug("GitHub App Installation Callback GET 요청: installationId={}",
//                installationId);
//
//        // repository 생성
//        try {
//            GitHub github = githubAppService.getGitHub(installationId);
//            List<GHRepository> repositories = github.getInstallation()
//                    .listRepositories()
//                    .toList();
//
//            // 따로 repo생성 dto로 repositories에서 owner 와 reponame 과 private여부 3개만 필요하니 따로 객체를 둬서 list로 뽑았다.
//            List<RepoCreateRequest> repoName = repositories.stream()
//                    .map(githubRepo -> {
//                        String[] parts = githubRepo.getFullName()
//                                .split("/", 2);
//                        String owner = parts.length > 0 ? parts[0] : "";
//                        String name = parts.length > 1 ? parts[1] : "";
//                        return RepoCreateRequest.builder()
//                                .githubOwnerUsername(owner)
//                                .githubRepoName(name)
//                                .isPrivate(githubRepo.isPrivate())
//                                .account(newAccount)
//                                .build();
//                    })
//                    .toList();
//
//            // 사용자 id를 기준으로 우리 db에 등록된 repo list를 가져와서 원래 등록된 repo인지 여부를 확인을하고 아니면 db에 저장하는 것으로 진행한다.
//            // hashSet을 써서 O( N + M ) 시간복잡도를 가지게 구현하였다.
//            List<RepoCreateRequest> repos = repoService.getReposByUserId(1L)
//                    .stream()
//                    .map(githubRepo -> {
//                        return RepoCreateRequest.builder()
//                                .githubRepoName(githubRepo.getGithubRepoName())
//                                .githubOwnerUsername(githubRepo.getGithubOwnerUsername())
//                                .isPrivate(githubRepo.isPrivate())
//                                .build();
//                    })
//                    .toList();
//
//            HashSet<RepoCreateRequest> repoHashSet = new HashSet<>(repos);
//            for (RepoCreateRequest repo : repoName) {
//                if (!repoHashSet.contains(repo)) {
//                    repoService.createRepo(repo);
//                }
//            }
//
//            List<RepoResponse> repo = repoService.getReposByUserId(1L);
//
//            return ResponseEntity.ok(repo);
//        } catch (IOException e) {
//            e.printStackTrace();
//            return null;
//        }

