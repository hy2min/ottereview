package com.ssafy.ottereview.githubapp.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RequiredArgsConstructor
@Controller
public class GithubCallbackController {

    @GetMapping("/")
    public String index() {
        return "index";
    }

    /**
     * GitHub App 설치 완료 후 콜백을 받는 API입니다. 이 URL은 GitHub App 설정의 "Setup URL" 또는 "Installation callback
     * URL" 필드에 등록해야 합니다. 이 API를 통해 설치 ID (installation_id)를 얻고, 이를 데이터베이스에 저장하여 향후 API 호출에 사용해야
     * 합니다.
     *
     * @param installationId 앱이 설치된 특정 GitHub 계정/조직/레포지토리를 식별하는 고유 ID.
     * @param setupAction    (선택 사항) 설치(install) 또는 업데이트(update)와 같은 설치 액션.
     * @return 설치 완료 메시지 또는 리디렉션.
     */
    @GetMapping("/github-app/installation/callback") // <-- GET 요청 처리를 위한 별도의 핸들러
    public ResponseEntity<String> githubAppInstallationCallbackGet(
            @RequestParam("installation_id") long installationId, // GET 요청 시 필수 파라미터
            @RequestParam(value = "setup_action", required = false) String setupAction,
            // GET 요청 시 선택적 파라미터
            @RequestParam(value = "continue", required = false) String continueParam
            // 'continue' 파라미터도 받도록 추가
    ) {
        System.out.println("GitHub App 설치 콜백 받음! (GET 요청)");
        System.out.println("Installation ID (from Param): " + installationId);
        System.out.println("Setup Action (from Param): " + setupAction);
        if (continueParam != null) {
            System.out.println("Continue Param: " + continueParam);
        }

        return new ResponseEntity<>(
                "GitHub App installation callback (GET) processed. ID: " + installationId,
                HttpStatus.OK);
    }
}
