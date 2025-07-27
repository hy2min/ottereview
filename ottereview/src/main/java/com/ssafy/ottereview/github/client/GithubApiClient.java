package com.ssafy.ottereview.github.client;

import com.ssafy.ottereview.github.dto.GithubAccountResponse;
import com.ssafy.ottereview.github.dto.GithubPrResponse;
import com.ssafy.ottereview.github.dto.GithubRepoResponse;
import com.ssafy.ottereview.github.util.GithubAppUtil;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHAppInstallation;
import org.kohsuke.github.GHIssueState;
import org.kohsuke.github.GHPullRequest;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.PagedIterable;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Transactional
@Service
@Slf4j
public class GithubApiClient {
    
    private final GithubAppUtil githubAppUtil;
    
    public GithubAccountResponse getAccount(Long installationId) {
        try {
            
            GitHub appGitHub = githubAppUtil.getGitHubAsApp();
            GHAppInstallation installation = appGitHub.getApp()
                    .getInstallationById(installationId);
            
            return new GithubAccountResponse(installation.getId(), installation.getAccount()
                    .getLogin(), installation.getAccount()
                    .getType());
            
        } catch (IOException e) {
            e.printStackTrace();
            // 실제 애플리케이션에서는 더 상세한 에러 메시지나 Custom Exception을 던질 수 있습니다.
            throw new RuntimeException("계정 정보를 가져오는 데 실패했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("JWT 생성 또는 GitHub API 호출 중 오류 발생: " + e.getMessage(), e);
        }
    }
    
    public List<GithubRepoResponse> getRepositories(Long installationId) {
        try {
            // InstallationTokenService를 통해 GitHub App 설치 인스턴스 가져오기
            GitHub github = githubAppUtil.getGitHub(installationId);
            
            // 해당 설치가 접근할 수 있는 저장소 목록을 가져옵니다.
            // .listInstallationRepositories()는 모든 접근 가능한 저장소를 반환합니다.
            List<GHRepository> repositories = github.getInstallation()
                    .listRepositories()
                    .toList();
            
            // 저장소 이름을 문자열 리스트로 변환하여 반환
            return repositories.stream()
                    .map(repo -> {
                        try {
                            return GithubRepoResponse.from(repo);
                        } catch (Exception e) {
                            log.error("Error converting repository to DTO: {}", e.getMessage());
                            // 실패한 경우 기본값으로 처리하거나 null 반환
                            return null;
                        }
                    }) // GHRepository의 fullName을 문자열로 변환
                    .collect(Collectors.toList());
            
        } catch (IOException e) {
            e.printStackTrace();
            // 실제 애플리케이션에서는 더 상세한 에러 메시지나 Custom Exception을 던질 수 있습니다.
            throw new RuntimeException("PR 목록을 가져오는 데 실패했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("JWT 생성 또는 GitHub API 호출 중 오류 발생: " + e.getMessage(), e);
        }
    }
    
    public List<GithubPrResponse> getPullRequests(Long installationId, String repositoryName) {
        try {
            // InstallationTokenService를 통해 GitHub App 설치 인스턴스 가져오기
            GitHub github = githubAppUtil.getGitHub(installationId);
            
            // 해당 설치가 접근할 수 있는 저장소 목록을 가져옵니다.
            // .listInstallationRepositories()는 모든 접근 가능한 저장소를 반환합니다.
            GHRepository repo = github.getRepository(repositoryName);
            log.info("Repository: {}", repo.getFullName());
            PagedIterable<GHPullRequest> pullRequests = repo.queryPullRequests()
                    .state(GHIssueState.OPEN) // GHIssueState.CLOSED, .ALL 등도 사용 가능
                    .list();
            
            // 저장소 이름을 문자열 리스트로 변환하여 반환
            return StreamSupport
                    .stream(pullRequests.spliterator(), false)
                    .map(pr -> {
                        try {
                            return GithubPrResponse.from(pr);
                        } catch (Exception e) {
                            log.error("Error converting PR to DTO: {}", e.getMessage());
                            // 실패한 경우 기본값으로 처리하거나 null 반환
                            return null;
                        }
                    })
                    .filter(Objects::nonNull) // null 제거
                    .collect(Collectors.toList());
            
        } catch (IOException e) {
            e.printStackTrace();
            // 실제 애플리케이션에서는 더 상세한 에러 메시지나 Custom Exception을 던질 수 있습니다.
            throw new RuntimeException("PR 목록을 가져오는 데 실패했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("JWT 생성 또는 GitHub API 호출 중 오류 발생: " + e.getMessage(), e);
        }
    }
}
