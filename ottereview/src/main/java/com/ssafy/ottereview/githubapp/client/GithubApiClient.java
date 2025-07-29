package com.ssafy.ottereview.githubapp.client;

import com.ssafy.ottereview.githubapp.dto.GithubAccountResponse;
import com.ssafy.ottereview.githubapp.dto.GithubPrResponse;
import com.ssafy.ottereview.githubapp.dto.GithubRepoResponse;
import com.ssafy.ottereview.githubapp.util.GithubAppUtil;
import com.ssafy.ottereview.pullrequest.dto.detail.PullRequestCommitDetail;
import com.ssafy.ottereview.pullrequest.dto.detail.PullRequestFileDetail;
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
import org.kohsuke.github.GHPullRequestCommitDetail;
import org.kohsuke.github.GHPullRequestFileDetail;
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

    public List<GHRepository> getRepositories(Long installationId) {
        try {
            // InstallationTokenService를 통해 GitHub App 설치 인스턴스 가져오기
            GitHub github = githubAppUtil.getGitHub(installationId);

            // 해당 설치가 접근할 수 있는 저장소 목록을 가져옵니다.
            // .listInstallationRepositories()는 모든 접근 가능한 저장소를 반환합니다.
            List<GHRepository> repositories = github.getInstallation()
                    .listRepositories()
                    .toList();

            return repositories;

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
            GitHub github = githubAppUtil.getGitHub(installationId);

            GHRepository repo = github.getRepository(repositoryName);

            PagedIterable<GHPullRequest> pullRequests = repo.queryPullRequests()
                    .state(GHIssueState.OPEN) // GHIssueState.CLOSED, .ALL 등도 사용 가능
                    .list();

            return StreamSupport
                    .stream(pullRequests.spliterator(), false)
                    .map(pr -> {
                        try {
                            return GithubPrResponse.from(pr);
                        } catch (Exception e) {
                            log.error("Error converting PR to DTO: {}", e.getMessage());
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

    public List<PullRequestFileDetail> getPullRequestFileChanges(Long installationId, String repositoryName, Integer githubPrNumber) {
        try {
            GitHub github = githubAppUtil.getGitHub(installationId);

            GHRepository repo = github.getRepository(repositoryName);

            GHPullRequest pullRequest = repo.getPullRequest(githubPrNumber);

            PagedIterable<GHPullRequestFileDetail> files = pullRequest.listFiles();

            return StreamSupport
                    .stream(files.spliterator(), false)
                    .map(file -> {
                        try {
                            return PullRequestFileDetail.from(file);
                        } catch (Exception e) {
                            log.error("Error converting file detail to DTO: {}", e.getMessage());
                            return null;
                        }
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

        } catch (IOException e) {
            e.printStackTrace();
            // 실제 애플리케이션에서는 더 상세한 에러 메시지나 Custom Exception을 던질 수 있습니다.
            throw new RuntimeException("PR 파일 변화 목록을 가져오는 데 실패했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("JWT 생성 또는 GitHub API 호출 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * Pull Request의 모든 커밋을 가져오는 메서드
     *
     * @param installationId GitHub App 설치 ID
     * @param repositoryName 저장소 전체 이름 (예: "owner/repo")
     * @param prNumber       Pull Request 번호
     * @return Pull Request 커밋 정보 리스트
     */
    public List<PullRequestCommitDetail> getPullRequestCommits(Long installationId, String repositoryName, Integer prNumber) {
        try {
            GitHub github = githubAppUtil.getGitHub(installationId);

            GHRepository repo = github.getRepository(repositoryName);

            GHPullRequest pullRequest = repo.getPullRequest(prNumber);

            PagedIterable<GHPullRequestCommitDetail> commits = pullRequest.listCommits();

            return StreamSupport
                    .stream(commits.spliterator(), false)
                    .map(commit -> {
                        try {
                            return PullRequestCommitDetail.from(commit);
                        } catch (Exception e) {
                            log.error("Error converting commit to DTO: {}", e.getMessage());
                            return null;
                        }
                    })
                    .filter(Objects::nonNull) // null 제거
                    .collect(Collectors.toList());

        } catch (IOException e) {
            e.printStackTrace();
            // 실제 애플리케이션에서는 더 상세한 에러 메시지나 Custom Exception을 던질 수 있습니다.
            throw new RuntimeException("PR 커밋 목록을 가져오는 데 실패했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("JWT 생성 또는 GitHub API 호출 중 오류 발생: " + e.getMessage(), e);
        }
    }
}
