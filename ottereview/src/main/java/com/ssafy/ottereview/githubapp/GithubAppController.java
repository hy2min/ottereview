package com.ssafy.ottereview.githubapp;

import com.ssafy.ottereview.githubapp.config.GithubAppConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

@Controller
public class GithubAppController {

  @Autowired
  private GithubAppConfig githubAppConfig;

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
    // String installationUrl = "https://github.com/apps/" + githubAppConfig.getAppId() + "/installations/new";

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
  public ResponseEntity<String> githubAppInstallationCallbackGet(
      @RequestParam("installation_id") long installationId, // GET 요청 시 필수 파라미터
      @RequestParam(value = "setup_action", required = false) String setupAction, // GET 요청 시 선택적 파라미터
      @RequestParam(value = "continue", required = false) String continueParam // 'continue' 파라미터도 받도록 추가
  ) {
    System.out.println("GitHub App 설치 콜백 받음! (GET 요청)");
    System.out.println("Installation ID (from Param): " + installationId);
    System.out.println("Setup Action (from Param): " + setupAction);
    if (continueParam != null) {
      System.out.println("Continue Param: " + continueParam);
    }

    // TODO: installationId와 관련 정보를 데이터베이스에 저장하는 로직 구현
    // (POST 메서드와 동일하게 처리하거나, GET 요청에 특화된 로직 구현)

    return new ResponseEntity<>("GitHub App installation callback (GET) processed. ID: " + installationId,
        HttpStatus.OK);
  }
}
