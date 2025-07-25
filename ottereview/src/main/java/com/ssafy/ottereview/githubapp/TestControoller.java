package com.ssafy.ottereview.githubapp;

import com.ssafy.ottereview.githubapp.utils.InstallationTokenService;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
public class TestControoller {

  private final InstallationTokenService installationTokenService;

  @GetMapping("/github/installation/{installationId}/repos")
  public List<String> getInstallationRepositories(@PathVariable long installationId) {
    try {
      // InstallationTokenService를 통해 GitHub App 설치 인스턴스 가져오기
      GitHub github = installationTokenService.generateGitHubByInstallationToken(installationId);

      // 해당 설치가 접근할 수 있는 저장소 목록을 가져옵니다.
      // .listInstallationRepositories()는 모든 접근 가능한 저장소를 반환합니다.
      List<GHRepository> repositories = github.getInstallation().listRepositories().toList();

      // 저장소 이름을 문자열 리스트로 변환하여 반환
      return repositories.stream()
          .map(GHRepository::getFullName)
          .collect(Collectors.toList());

    } catch (IOException e) {
      e.printStackTrace();
      // 실제 애플리케이션에서는 더 상세한 에러 메시지나 Custom Exception을 던질 수 있습니다.
      throw new RuntimeException("저장소 목록을 가져오는 데 실패했습니다: " + e.getMessage(), e);
    } catch (Exception e) {
      e.printStackTrace();
      throw new RuntimeException("JWT 생성 또는 GitHub API 호출 중 오류 발생: " + e.getMessage(), e);
    }
  }

}