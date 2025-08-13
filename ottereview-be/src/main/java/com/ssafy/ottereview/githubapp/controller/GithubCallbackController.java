package com.ssafy.ottereview.githubapp.controller;

import com.ssafy.ottereview.common.annotation.MvcController;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.githubapp.exception.GithubAppErrorCode;
import com.ssafy.ottereview.githubapp.util.GithubInstallationFacade;
import com.ssafy.ottereview.githubapp.util.GithubUpdateFacade;
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
@MvcController
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
    @GetMapping("/api/github-app/installation/callback") // <-- GET 요청 처리를 위한 별도의 핸들러
    public ResponseEntity<Void> githubAppInstallationCallbackGet(
            @RequestParam(value = "installation_id", required = false) Long installationId, // GET 요청 시 필수 파라미터
            @RequestParam("code") String code,
            @RequestParam("setup_action") String setupAction
    ) {
        try {
            log.debug("GitHub App Installation Callback GET 요청: installationId={}, code={}, setupAction={}",
                    installationId, code, setupAction);

            if (setupAction.equals("install")) {
                log.debug("install 로직 실행");
                githubInstallationFacade.processInstallationWithOAuth(installationId, code);
            }

            //🎯 리디렉션할 프론트엔드 URI
           log.debug("리다이렉트 URL 생성");
          URI redirectUri = URI.create("http://localhost:5173/install-complete"); // 또는 환경 변수로 관리

            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(redirectUri)
                    .build();

        } catch (Exception e) {
            e.printStackTrace();
            throw new BusinessException(GithubAppErrorCode.GITHUB_APP_INSTALLATION_FAILED);
        }
    }
}

