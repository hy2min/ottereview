package com.ssafy.ottereview.githubapp.client;

import com.ssafy.ottereview.githubapp.dto.GithubAccountResponse;
import com.ssafy.ottereview.githubapp.dto.GithubPrResponse;
import com.ssafy.ottereview.githubapp.util.GithubAppUtil;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestCommitInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestFileInfo;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestDetailResponse;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.pullrequest.util.PullRequestMapper;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHAppInstallation;
import org.kohsuke.github.GHBranch;
import org.kohsuke.github.GHCommit;
import org.kohsuke.github.GHCompare;
import org.kohsuke.github.GHCompare.Commit;
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
    private final PullRequestRepository pullRequestRepository;
    private final PullRequestMapper pullRequestMapper;

    public GithubAccountResponse getAccount(Long installationId) {
        try {

            GitHub appGitHub = githubAppUtil.getGitHubAsApp();
            GHAppInstallation installation = appGitHub.getApp()
                    .getInstallationById(installationId);
            
            return new GithubAccountResponse(installation.getId(), installation.getAccount()
                    .getLogin(), installation.getAccount()
                    .getType(),
                    installation.getAccount().getId()
            );

        } catch (IOException e) {
            e.printStackTrace();
            // 실제 애플리케이션에서는 더 상세한 에러 메시지나 Custom Exception을 던질 수 있습니다.
            throw new RuntimeException("계정 정보를 가져오는 데 실패했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("JWT 생성 또는 GitHub API 호출 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * Repository 정보 가져오기
     */
    public GHRepository getRepository(Long installationId, String repositoryName) {
        try {
            GitHub github = githubAppUtil.getGitHub(installationId);
            return github.getRepository(repositoryName);

        } catch (IOException e) {
            log.error("Repository 정보를 가져오는 데 실패했습니다: {}", e.getMessage(), e);
            throw new RuntimeException("Repository 정보를 가져오는 데 실패했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("JWT 생성 또는 GitHub API 호출 중 오류 발생: {}", e.getMessage(), e);
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

            return StreamSupport.stream(pullRequests.spliterator(), false)
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

    public boolean pullRequestExists(Long installationId, String repositoryName, String branchName) {
        try {
            GitHub github = githubAppUtil.getGitHub(installationId);
            GHRepository repo = github.getRepository(repositoryName);

            PagedIterable<GHPullRequest> prs = repo.queryPullRequests()
                    .state(GHIssueState.OPEN)
                    .list();

            return StreamSupport.stream(prs.spliterator(), false)
                    .anyMatch(pr -> {
                        try {
                            return branchName.equals(pr.getHead()
                                    .getRef());
                        } catch (Exception e) {
                            log.error("Error checking PR head ref: {}", e.getMessage());
                            return false;
                        }
                    });

        } catch (IOException e) {
            log.error("PR 존재 여부 확인 실패: {}", e.getMessage(), e);
            return true; // 에러 시 생성하지 않음
        } catch (Exception e) {
            log.error("JWT 생성 또는 GitHub API 호출 중 오류 발생: {}", e.getMessage(), e);
            return true;
        }
    }
    
    public PullRequestDetailResponse getPullRequestDetail(Long prId, String repositoryName){
        
        PullRequest pullRequest = pullRequestRepository.findById(prId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Pull Request not found with id: " + prId));
        
        Integer githubPrNumber = pullRequest.getGithubPrNumber();
        
        Long installationId = pullRequest.getRepo()
                .getAccount()
                .getInstallationId();
        
        List<PullRequestFileInfo> pullRequestFileChanges = getPullRequestFileChanges(installationId, repositoryName, githubPrNumber);
        List<PullRequestCommitInfo> pullRequestCommitInfos = getPullRequestCommits(installationId, repositoryName, githubPrNumber);
        
        return  pullRequestMapper.pullRequestToDetailResponse(pullRequest, pullRequestFileChanges,
                pullRequestCommitInfos);
    }

    private List<PullRequestFileInfo> getPullRequestFileChanges(Long installationId, String repositoryName, Integer githubPrNumber) {
        try {
            GitHub github = githubAppUtil.getGitHub(installationId);

            GHRepository repo = github.getRepository(repositoryName);

            GHPullRequest pullRequest = repo.getPullRequest(githubPrNumber);

            PagedIterable<GHPullRequestFileDetail> files = pullRequest.listFiles();

            return StreamSupport.stream(files.spliterator(), false)
                    .map(file -> {
                        try {
                            return PullRequestFileInfo.from(file);
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
    private List<PullRequestCommitInfo> getPullRequestCommits(Long installationId, String repositoryName, Integer prNumber) {
        try {
            GitHub github = githubAppUtil.getGitHub(installationId);

            GHRepository repo = github.getRepository(repositoryName);

            GHPullRequest pullRequest = repo.getPullRequest(prNumber);

            PagedIterable<GHPullRequestCommitDetail> commits = pullRequest.listCommits();

            return StreamSupport.stream(commits.spliterator(), false)
                    .map(commit -> {
                        try {
                            return PullRequestCommitInfo.from(commit);
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

    /**
     * 두 커밋 간의 비교 정보 가져오기
     */
    public GHCompare getCompare(Long installationId, String repositoryName, String baseSha, String headSha) {
        try {
            log.info("getCompare 호출: installationId={}, repositoryName={}, baseSha={}, headSha={}",
                    installationId, repositoryName, baseSha, headSha);

            GitHub github = githubAppUtil.getGitHub(installationId);

            log.info("GitHub 클라이언트 생성 완료");
            GHRepository repo = github.getRepository(repositoryName);
            log.info("Repository 정보 가져오기 완료: {}", repo.getName());
            return repo.getCompare(baseSha, headSha);

        } catch (IOException e) {
            e.printStackTrace();
            throw new RuntimeException("커밋 비교 정보를 가져오는 데 실패했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("JWT 생성 또는 GitHub API 호출 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * 변경된 파일 목록 가져오기
     */
    public List<GHCommit.File> getChangedFiles(Long installationId, String repositoryName, String baseSha, String headSha) {
        try {
            log.info("getChangedFiles 호출: installationId={}, repositoryName={}, baseSha={}, headSha={}",
                    installationId, repositoryName, baseSha, headSha);

            GHCompare compare = getCompare(installationId, repositoryName, baseSha, headSha);
            return Arrays.stream(compare.getFiles())
                    .toList();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("변경된 파일 목록을 가져오는 데 실패했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * Pull Request 생성
     */
    public GHPullRequest createPullRequest(Long installationId, String repositoryName, String title, String body, String head, String base) {
        try {
            GitHub github = githubAppUtil.getGitHub(installationId);
            GHRepository repo = github.getRepository(repositoryName);

            return repo.createPullRequest(title, head, base, body);

        } catch (IOException e) {
            log.error("Pull Request 생성에 실패했습니다: {}", e.getMessage(), e);
            throw new RuntimeException("Pull Request 생성에 실패했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("JWT 생성 또는 GitHub API 호출 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("JWT 생성 또는 GitHub API 호출 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * 특정 커밋의 상세 정보 가져오기
     */
    public GHCommit getCommit(Long installationId, String repositoryName, String sha) {
        try {
            GitHub github = githubAppUtil.getGitHub(installationId);
            GHRepository repo = github.getRepository(repositoryName);

            return repo.getCommit(sha);

        } catch (IOException e) {
            log.error("커밋 정보를 가져오는 데 실패했습니다: {}", e.getMessage(), e);
            throw new RuntimeException("커밋 정보를 가져오는 데 실패했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("JWT 생성 또는 GitHub API 호출 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("JWT 생성 또는 GitHub API 호출 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * 브랜치 정보 가져오기
     */
    public GHBranch getBranch(Long installationId, String repositoryName, String branchName) {
        try {
            GitHub github = githubAppUtil.getGitHub(installationId);
            GHRepository repo = github.getRepository(repositoryName);

            return repo.getBranch(branchName);

        } catch (IOException e) {
            log.error("브랜치 정보를 가져오는 데 실패했습니다: {}", e.getMessage(), e);
            throw new RuntimeException("브랜치 정보를 가져오는 데 실패했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("JWT 생성 또는 GitHub API 호출 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("JWT 생성 또는 GitHub API 호출 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * Repository의 기본 브랜치 가져오기
     */
    public String getDefaultBranch(Long installationId, String repositoryName) {
        try {
            GHRepository repo = getRepository(installationId, repositoryName);
            return repo.getDefaultBranch();

        } catch (Exception e) {
            log.error("기본 브랜치 정보를 가져오는 데 실패했습니다: {}", e.getMessage(), e);
            return "main"; // 기본값 반환
        }
    }

    /**
     * 파일의 상세 diff 정보 가져오기 (GitHub API 직접 호출)
     */
    /**
     * 파일의 상세 diff 정보 가져오기
     */
    public String getFileDiff(Long installationId, String repositoryName, String sha, String filename) {
        try {
            GitHub github = githubAppUtil.getGitHub(installationId);
            GHRepository repo = github.getRepository(repositoryName);

            // GHCommit에서는 직접 파일 정보를 가져올 수 없으므로
            // 단일 커밋을 compare로 비교해서 파일 정보 가져오기
            GHCompare compare = repo.getCompare(sha + "^", sha); // 이전 커밋과 현재 커밋 비교

            for (GHCommit.File file : compare.getFiles()) {
                if (file.getFileName()
                        .equals(filename)) {
                    return file.getPatch();
                }
            }

            return "";

        } catch (IOException e) {
            log.error("파일 diff 정보를 가져오는 데 실패했습니다: {}", e.getMessage(), e);
            throw new RuntimeException("파일 diff 정보를 가져오는 데 실패했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("JWT 생성 또는 GitHub API 호출 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("JWT 생성 또는 GitHub API 호출 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * 특정 범위의 커밋 목록 가져오기
     */
    public List<Commit> getCommits(Long installationId, String repositoryName, String baseSha, String headSha) {
        try {
            log.info("getCommits 호출: installationId={}, repositoryName={}, baseSha={}, headSha={}",
                    installationId, repositoryName, baseSha, headSha);

            GHCompare compare = getCompare(installationId, repositoryName, baseSha, headSha);
            return Arrays.stream(compare.getCommits())
                    .toList();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("커밋 목록을 가져오는 데 실패했습니다: " + e.getMessage(), e);
        }
    }

    public String getOrgName(GHAppInstallation installation){
        return installation.getAccount().getLogin();
    }
}
