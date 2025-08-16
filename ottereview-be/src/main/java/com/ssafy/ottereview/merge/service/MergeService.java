package com.ssafy.ottereview.merge.service;

import com.ssafy.ottereview.account.service.UserAccountService;
import com.ssafy.ottereview.ai.client.AiClient;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.githubapp.util.GithubAppUtil;
import com.ssafy.ottereview.merge.dto.MergeCheckResponse;
import com.ssafy.ottereview.merge.dto.MergeResponse;
import com.ssafy.ottereview.merge.dto.MergedPullRequestInfo;
import com.ssafy.ottereview.merge.exception.MergeErrorCode;
import com.ssafy.ottereview.priority.repository.PriorityRepository;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestPriorityInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestReviewerInfo;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestDetailResponse;
import com.ssafy.ottereview.pullrequest.entity.PrState;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.pullrequest.service.PullRequestService;
import com.ssafy.ottereview.pullrequest.util.PullRequestMapper;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.exception.RepoErrorCode;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.reviewer.repository.ReviewerRepository;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.ListBranchCommand;
import org.eclipse.jgit.api.MergeResult;
import org.eclipse.jgit.api.TransportConfigCallback;
import org.eclipse.jgit.api.errors.RefNotFoundException;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.ObjectLoader;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.lib.StoredConfig;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevTree;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.transport.RefSpec;
import org.eclipse.jgit.transport.Transport;
import org.eclipse.jgit.transport.TransportHttp;
import org.eclipse.jgit.transport.URIish;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.kohsuke.github.GHAppInstallation;
import org.kohsuke.github.GHAppInstallationToken;
import org.kohsuke.github.GHPullRequest;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.GitHubBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MergeService {
    
    private static final Logger log = LoggerFactory.getLogger(MergeService.class);
    private final GithubAppUtil githubAppUtil;
    private final AiClient aiClient;
    private final PullRequestRepository pullRequestRepository;
    private final UserAccountService userAccountService;
    private final GithubApiClient githubApiClient;
    private final ReviewerRepository reviewerRepository;
    private final PriorityRepository priorityRepository;
    private final PullRequestMapper pullRequestMapper;
    private final RepoRepository repoRepository;
    private final PullRequestService pullRequestService;
    
    @Value("${github.app.authentication-jwt-expm}")
    private Long jwtTExpirationMillis;
    
    public static void deleteDirectoryRecursively(File dir) throws IOException {
        if (dir.isDirectory()) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File f : files) {
                    deleteDirectoryRecursively(f);
                }
            }
        }
        dir.delete();
    }
    
    public String getHttpsUrl(Repo repo) {
        String baseUrl = null;
        try {
            GitHub github = githubAppUtil.getGitHub(repo.getAccount()
                    .getInstallationId());
            GHRepository repository = github.getRepository(repo.getFullName());
            return repository.getHttpTransportUrl();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return baseUrl;
    }
    
    public Path createServiceTempDirectory() throws IOException {
        // OS 임시 경로 내 서비스 전용 폴더 생성
        Path baseTempDir = Path.of(System.getProperty("java.io.tmpdir"), "ottereview");
        
        // 서비스 폴더가 없으면 미리 생성
        if (!Files.exists(baseTempDir)) {
            Files.createDirectories(baseTempDir);
        }
        
        // 작업별 고유 임시 폴더 생성(예: UUID)
        Path jobTempDir = Files.createTempDirectory(baseTempDir, "mergejob");
        
        return jobTempDir;
    }
    
    public GHAppInstallationToken getToken(Long installationId) throws Exception {
        String jwtToken = githubAppUtil.generateJwt(jwtTExpirationMillis);
        
        // 2. Github 인증
        GitHub gitHubApp = new GitHubBuilder()
                .withJwtToken(jwtToken)
                .build();
        
        // 3. installation_token 발급
        GHAppInstallation installation = gitHubApp.getApp()
                .getInstallationById(installationId);
        GHAppInstallationToken installationToken = installation.createToken()
                .create();
        return installationToken;
    }
    
    public Git cloneRepository(String repoUrl, String localPath, Long installationId)
            throws Exception {
        GHAppInstallationToken installationToken = getToken(installationId);
        var creds = new UsernamePasswordCredentialsProvider("x-access-token", installationToken.getToken());
        return Git.cloneRepository()
                .setURI(repoUrl)
                .setDirectory(new File(localPath))
                .setCredentialsProvider(creds)
                // HTTP 전송 객체에도 creds 적용
                .setTransportConfigCallback(new TransportConfigCallback() {
                    @Override
                    public void configure(Transport transport) {
                        if (transport instanceof TransportHttp) {
                            ((TransportHttp) transport).setCredentialsProvider(creds);
                        }
                    }
                })
                .call();
    }
    
    public MergeResult tryMerge(Git git, String baseBranch, String compareBranch, Long installationId) throws Exception {
        GHAppInstallationToken installationToken = getToken(installationId);
        var creds = new UsernamePasswordCredentialsProvider("x-access-token", installationToken.getToken());
        
        // 1. 원격 최신 가져오기
        git.fetch()
                .setRemote("origin")
                .setCredentialsProvider(creds)
                // HTTP 전송 객체에도 creds 적용
                .setTransportConfigCallback(new TransportConfigCallback() {
                    @Override
                    public void configure(Transport transport) {
                        if (transport instanceof TransportHttp) {
                            ((TransportHttp) transport).setCredentialsProvider(creds);
                        }
                    }
                })
                .call();
        
        // 2. baseBranch 체크아웃 (없으면 origin/{baseBranch} 기반으로 생성)
        checkoutOrCreateBranch(git, baseBranch);
        
        // 3. compareBranch ref 준비 (로컬이 있으면 로컬, 없으면 원격)
        Ref compareRef = null;
        // 로컬 branch
        for (Ref ref : git.branchList()
                .call()) {
            if (ref.getName()
                    .endsWith("/" + compareBranch)) {
                compareRef = ref;
                break;
            }
        }
        // 로컬에 없으면 origin/compareBranch
        if (compareRef == null) {
            for (Ref ref : git.branchList()
                    .setListMode(ListBranchCommand.ListMode.REMOTE)
                    .call()) {
                if (ref.getName()
                        .endsWith("/" + compareBranch)) { // refs/remotes/origin/compareBranch
                    compareRef = ref;
                    break;
                }
            }
        }
        if (compareRef == null) {
            throw new RefNotFoundException("비교할 브랜치가 존재하지 않습니다: " + compareBranch);
        }
        
        // 4. 병합 시뮬레이션: 커밋하지 않도록 해서 충돌만 검출
        MergeResult result = git.merge()
                .include(compareRef)
                .setCommit(false) // 실제 merge commit 만들지 않음
                .call();
        if (result.getMergeStatus()
                .isSuccessful()) {
            System.out.println("Merge successful (no commit performed)");
        } else if (result.getMergeStatus()
                .equals(MergeResult.MergeStatus.CONFLICTING)) {
            System.out.println("Merge conflict detected");
            System.out.println("Conflicting files: " + result.getConflicts()
                    .keySet());
        } else {
            System.out.println("Merge status: " + result.getMergeStatus());
        }
        
        return result;
    }
    
    private void checkoutOrCreateBranch(Git git, String branchName) throws Exception {
        boolean hasLocal = git.branchList()
                .call()
                .stream()
                .anyMatch(ref -> ref.getName()
                        .endsWith("/" + branchName)); // refs/heads/branchName
        
        if (hasLocal) {
            git.checkout()
                    .setName(branchName)
                    .call();
            return;
        }
        
        // 로컬에 없으면 원격에 있는지 확인
        boolean hasRemote = git.branchList()
                .setListMode(ListBranchCommand.ListMode.REMOTE)
                .call()
                .stream()
                .anyMatch(ref -> ref.getName()
                        .endsWith("/" + branchName)); // refs/remotes/origin/branchName
        
        if (!hasRemote) {
            throw new RefNotFoundException("브랜치가 로컬/원격 어디에도 없습니다: " + branchName);
        }
        
        // origin/{branchName} 기반으로 로컬 브랜치 생성 후 체크아웃
        git.checkout()
                .setName(branchName)
                .setCreateBranch(true)
                .setStartPoint("origin/" + branchName)
                .call();
    }
    
    public List<String> extractConflictBlocks(String filePath) throws Exception {
        List<String> lines = Files.readAllLines(Paths.get(filePath));
        List<String> conflicts = new ArrayList<>();
        boolean inConflict = false;
        StringBuilder currentBlock = new StringBuilder();
        
        for (String line : lines) {
            if (line.startsWith("<<<<<<<")) {
                inConflict = true;
                currentBlock.setLength(0);
                currentBlock.append(line)
                        .append("\n");
            } else if (inConflict && line.startsWith(">>>>>>>")) {
                currentBlock.append(line)
                        .append("\n");
                conflicts.add(currentBlock.toString());
                inConflict = false;
            } else if (inConflict) {
                currentBlock.append(line)
                        .append("\n");
            }
        }
        return conflicts;
    }
    
    public MergeResponse simulateMergeAndDetectConflicts(
            String repoUrl,
            String baseBranch,
            String compareBranch,
            Long installationId
    ) throws Exception {
        Path tempPath = createServiceTempDirectory();
        log.info("임시 디렉터리 생성: {}", tempPath);
        try {
            // 1. clone repo
            Git git = cloneRepository(repoUrl, tempPath.toString(), installationId);

            ensureOrigin(git, repoUrl);

            GHAppInstallationToken installationToken = getToken(installationId);
            var creds = new UsernamePasswordCredentialsProvider("x-access-token", installationToken.getToken());
            // 2. 원격 브랜치 정보 fetch (한 번만)
            git.fetch()
                    .setRemote("origin")
                    .setRefSpecs(new RefSpec("+refs/heads/*:refs/remotes/origin/*"))
                    .setCredentialsProvider(creds)
                    // HTTP 전송 객체에도 creds 적용
                    .setTransportConfigCallback(new TransportConfigCallback() {
                        @Override
                        public void configure(Transport transport) {
                            if (transport instanceof TransportHttp) {
                                ((TransportHttp) transport).setCredentialsProvider(creds);
                            }
                        }
                    })
                    .call();
            
            // 3. 병합 시도
            MergeResult mergeResult = tryMerge(git, baseBranch, compareBranch, installationId);
            if (mergeResult.getMergeStatus() == MergeResult.MergeStatus.CONFLICTING) {
                Set<String> conflictFiles = mergeResult.getConflicts()
                        .keySet();
                
                List<String> conflictBlocksList = new ArrayList<>();
                Map<String, String> baseFileContents = new HashMap<>();
                Map<String, String> headFileContents = new HashMap<>();
                
                for (String filePath : conflictFiles) {
                    // --- base 브랜치 원본 내용 ---
                    String baseContent = getFileContentFromBranch(git, baseBranch, filePath, installationId);
                    baseFileContents.put(filePath, baseContent);
                    
                    // --- compareBranch(head) 원본 내용 ---
                    String headContent = getFileContentFromBranch(git, compareBranch, filePath, installationId);
                    headFileContents.put(filePath, headContent);
                    
                    // --- 워킹 디렉터리에 남은 충돌 마커 블록 ---
                    StringBuilder blocks = new StringBuilder();
                    for (String block : extractConflictBlocks(tempPath + "/" + filePath)) {
                        blocks.append("<<<<<<< CONFLICT in ")
                                .append(filePath)
                                .append("\n")
                                .append(block)
                                .append(">>>>>>> END CONFLICT\n\n");
                    }
                    conflictBlocksList.add(blocks.toString());
                }
                
                return MergeResponse.builder()
                        .files(conflictFiles)
                        .conflictFilesContents(conflictBlocksList)
                        .baseFileContents(baseFileContents)
                        .headFileContents(headFileContents)
                        .build();
            }
        } finally {
            deleteDirectoryRecursively(tempPath.toFile());
        }
        return null;
    }

    private void ensureOrigin(Git git, String repoUrl) throws Exception {
        StoredConfig cfg = git.getRepository().getConfig();
        if (cfg.getString("remote", "origin", "url") == null) {
            log.info("임시로 생성한다");
            git.remoteAdd()
                    .setName("origin")
                    .setUri(new URIish(repoUrl))
                    .call();
            cfg.setString("remote", "origin", "fetch", "+refs/heads/*:refs/remotes/origin/*");
            cfg.save();
        }
    }

    private String getFileContentFromBranch(Git git, String branch, String path, Long installationId) throws Exception {
        Repository repo = git.getRepository();
        GHAppInstallationToken installationToken = getToken(installationId);
        var creds = new UsernamePasswordCredentialsProvider("x-access-token", installationToken.getToken());
        // 1) 먼저 fetch
        git.fetch()
                .setRemote("origin")
                .setRefSpecs(new RefSpec("+refs/heads/*:refs/remotes/origin/*"))
                .setCredentialsProvider(creds)
                // HTTP 전송 객체에도 creds 적용
                .setTransportConfigCallback(new TransportConfigCallback() {
                    @Override
                    public void configure(Transport transport) {
                        if (transport instanceof TransportHttp) {
                            ((TransportHttp) transport).setCredentialsProvider(creds);
                        }
                    }
                })
                .call();
        
        // 2) 커밋 ID resolve with fallback
        ObjectId commitId = repo.resolve(branch + "^{commit}");
        if (commitId == null) {
            commitId = repo.resolve("refs/heads/" + branch + "^{commit}");
        }
        if (commitId == null) {
            commitId = repo.resolve("refs/remotes/origin/" + branch + "^{commit}");
        }
        if (commitId == null) {
            throw new IllegalArgumentException("브랜치를 찾을 수 없습니다: " + branch);
        }
        
        // 3) RevWalk + TreeWalk 로 파일 읽기
        try (RevWalk revWalk = new RevWalk(repo)) {
            RevCommit commit = revWalk.parseCommit(commitId);
            RevTree tree = commit.getTree();
            
            try (TreeWalk tw = TreeWalk.forPath(repo, path, tree)) {
                if (tw == null) {
                    return "";
                }
                ObjectId blobId = tw.getObjectId(0);
                ObjectLoader loader = repo.open(blobId);
                byte[] bytes = loader.getBytes();
                return new String(bytes, StandardCharsets.UTF_8);
            }
        }
    }
    
    @Transactional
    public boolean doMerge(CustomUserDetail customUserDetail, Long repoId, Long prId) {
        
        Repo repo = userAccountService.validateUserPermission(customUserDetail.getUser()
                .getId(), repoId);
        
        PullRequest pullRequest = pullRequestRepository.findById(prId)
                .orElseThrow();
        
        if (pullRequest.getMergeable()) {
            try {
                // Db에 저장된 정보를 가지고 PR 객체를 가져온다!
                GitHub gitHub = githubAppUtil.getGitHub(repo.getAccount()
                        .getInstallationId());
                GHRepository repository = gitHub.getRepository(repo.getFullName());
                GHPullRequest ghPullRequest = repository.getPullRequest(pullRequest.getGithubPrNumber());
                
                // github에서 가져온 pullRequest 객체로 삭제한다.
                ghPullRequest.merge("Merge PR #" + pullRequest.getGithubPrNumber() + " " + pullRequest.getHead() + " -> " + pullRequest.getBase());
                
                log.info("Merge PR #" + pullRequest.getGithubPrNumber() + " " + pullRequest.getHead() + " -> " + pullRequest.getBase());
                
                // pullRequest 속성값 업데이트해서 merged로 바꾸기
                pullRequest.updateState(PrState.MERGED);
                
                // 머지 성공 시 Python 서버에 관련 정보 저장
                PullRequestDetailResponse pullRequestDetail = githubApiClient.getPullRequestDetail(prId, repo.getFullName());
                
                List<PullRequestReviewerInfo> reviewers = reviewerRepository.findAllByPullRequest(pullRequest)
                        .stream()
                        .map(PullRequestReviewerInfo::fromEntity)
                        .toList();
                
                List<PullRequestPriorityInfo> priorities = priorityRepository.findAllByPullRequest(pullRequest)
                        .stream()
                        .map(PullRequestPriorityInfo::fromEntity)
                        .toList();
                
                MergedPullRequestInfo mergedPullRequestInfo = MergedPullRequestInfo.from(pullRequestDetail,
                        reviewers,
                        priorities);
                
                aiClient.saveVectorDb(mergedPullRequestInfo).subscribe();
                
                return true;
                
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return false;
    }

    @Transactional
    public MergeCheckResponse checkMergeConflict(Long repoId, PullRequest pullRequest) {
        Repo repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new BusinessException(RepoErrorCode.REPO_NOT_FOUND));
        MergeCheckResponse result = null;
        try {
            GitHub gitHub = githubAppUtil.getGitHub(repo.getAccount()
                    .getInstallationId());
            GHRepository repository = gitHub.getRepository(repo.getFullName());
            GHPullRequest ghPullRequest = repository.getPullRequest(pullRequest.getGithubPrNumber());

            // 머지 가능 여부 확인
            Boolean mergeable = ghPullRequest.getMergeable();
            String mergeableState = ghPullRequest.getMergeableState();

            // pr 업데이트 동기화 로직
            pullRequest.changeMergeable(mergeable);
            pullRequestRepository.save(pullRequest);

            result = MergeCheckResponse.builder()
                    .prNumber(pullRequest.getGithubPrNumber())
                    .title(ghPullRequest.getTitle())
                    .state(ghPullRequest.getState()
                            .name())
                    .mergeable(mergeable)
                    .hasConflicts(!mergeable)
                    .mergeState(mergeableState)
                    .build();
            return result;
        } catch (Exception e) {
            log.error("Failed to check merge conflict for repoId={}, prNumber={}",
                    repoId, pullRequest.getGithubPrNumber(), e);
            throw new BusinessException(MergeErrorCode.MERGE_CHECK_FAILED);
        }
    }
}
