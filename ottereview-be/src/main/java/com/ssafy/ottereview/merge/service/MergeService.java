package com.ssafy.ottereview.merge.service;

import com.ssafy.ottereview.githubapp.util.GithubAppUtil;
import com.ssafy.ottereview.merge.dto.MergeCheckResponse;
import com.ssafy.ottereview.merge.dto.MergeResponse;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.pullrequest.service.PullRequestService;
import com.ssafy.ottereview.repo.entity.Repo;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.ListBranchCommand;
import org.eclipse.jgit.api.MergeResult;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.RefNotFoundException;
import org.eclipse.jgit.lib.Ref;
import org.kohsuke.github.GHPullRequest;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MergeService {
    private static final Logger log = LoggerFactory.getLogger(MergeService.class);
    private final GithubAppUtil githubAppUtil;
    private final PullRequestRepository pullRequestRepository;

    public MergeCheckResponse checkMergeConflict(Repo repo , PullRequest pullRequest){
        MergeCheckResponse result = null;
        try{
            GitHub gitHub = githubAppUtil.getGitHub(repo.getAccount().getInstallationId());
            GHRepository repository = gitHub.getRepository(repo.getFullName());
            GHPullRequest ghPullRequest = repository.getPullRequest(pullRequest.getGithubPrNumber());

            // 머지 가능 여부 확인
            Boolean mergeable = ghPullRequest.getMergeable();
            String mergeableState = ghPullRequest.getMergeableState();

            result = MergeCheckResponse.builder().prNumber(pullRequest.getGithubPrNumber())
                    .title(ghPullRequest.getTitle())
                    .state(ghPullRequest.getState().name())
                    .mergeAble(mergeable)
                    .hasConflicts(!mergeable)
                    .mergeState(mergeableState).build();
            return result;
        } catch (IOException e) {
            throw new RuntimeException(e);
        } catch (Exception e){
            e.printStackTrace();
        }
        return result;
    }

    public String getHttpsUrl(Repo repo){
        String baseUrl= null;
        try {
            GitHub github = githubAppUtil.getGitHub(repo.getAccount().getInstallationId());
            GHRepository repository = github.getRepository(repo.getFullName());
            return repository.getHttpTransportUrl();
        }catch(Exception e){
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

    public Git cloneRepository(String repoUrl, String localPath) throws GitAPIException, GitAPIException {
        return Git.cloneRepository()
                .setURI(repoUrl)
                .setDirectory(new File(localPath))
                .call();
    }

    public MergeResult tryMerge(Git git, String baseBranch, String compareBranch) throws Exception {
        // 1. 원격 최신 가져오기
        git.fetch().setRemote("origin").call();

        // 2. baseBranch 체크아웃 (없으면 origin/{baseBranch} 기반으로 생성)
        checkoutOrCreateBranch(git, baseBranch);

        // 3. compareBranch ref 준비 (로컬이 있으면 로컬, 없으면 원격)
        Ref compareRef = null;
        // 로컬 branch
        for (Ref ref : git.branchList().call()) {
            if (ref.getName().endsWith("/" + compareBranch)) {
                compareRef = ref;
                break;
            }
        }
        // 로컬에 없으면 origin/compareBranch
        if (compareRef == null) {
            for (Ref ref : git.branchList().setListMode(ListBranchCommand.ListMode.REMOTE).call()) {
                if (ref.getName().endsWith("/" + compareBranch)) { // refs/remotes/origin/compareBranch
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
        if (result.getMergeStatus().isSuccessful()) {
            System.out.println("Merge successful (no commit performed)");
        } else if (result.getMergeStatus().equals(MergeResult.MergeStatus.CONFLICTING)) {
            System.out.println("Merge conflict detected");
            System.out.println("Conflicting files: " + result.getConflicts().keySet());
        } else {
            System.out.println("Merge status: " + result.getMergeStatus());
        }

        return result;
    }

    private void checkoutOrCreateBranch(Git git, String branchName) throws Exception {
        boolean hasLocal = git.branchList().call().stream()
                .anyMatch(ref -> ref.getName().endsWith("/" + branchName)); // refs/heads/branchName

        if (hasLocal) {
            git.checkout().setName(branchName).call();
            return;
        }

        // 로컬에 없으면 원격에 있는지 확인
        boolean hasRemote = git.branchList()
                .setListMode(ListBranchCommand.ListMode.REMOTE)
                .call().stream()
                .anyMatch(ref -> ref.getName().endsWith("/" + branchName)); // refs/remotes/origin/branchName

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

        for(String line : lines){
            if(line.startsWith("<<<<<<<")){
                inConflict = true;
                currentBlock.setLength(0);
                currentBlock.append(line).append("\n");
            } else if(inConflict && line.startsWith(">>>>>>>")){
                currentBlock.append(line).append("\n");
                conflicts.add(currentBlock.toString());
                inConflict = false;
            } else if(inConflict){
                currentBlock.append(line).append("\n");
            }
        }
        return conflicts;
    }

    public MergeResponse simulateMergeAndDetectConflicts(String repoUrl, String baseBranch, String compareBranch) throws Exception {
        Path tempPath = createServiceTempDirectory();
        log.info("여기에 설치되었습니다! "+tempPath);
        try {
            // 1. clone repo
            Git git = cloneRepository(repoUrl, tempPath.toString());

            // 2. 병합 시도
            MergeResult mergeResult= tryMerge(git, baseBranch, compareBranch);
            MergeResponse mergeResponse;
            List<String> conflictFilesContent = new ArrayList<>();
            Set<String> conflictFiles = mergeResult.getConflicts().keySet();
            // 3. 충돌 발생 시 파일 이름과 충돌 마커 출력
            if (mergeResult.getMergeStatus().equals(MergeResult.MergeStatus.CONFLICTING)) {
                for (String conflictFile : mergeResult.getConflicts().keySet()) {
                    StringBuilder allConflictBlocks = new StringBuilder();
                    String conflictFilePath = tempPath + "/" + conflictFile;
                    System.out.println("Conflict in file: " + conflictFile);
                    List<String> conflictBlocks = extractConflictBlocks(conflictFilePath);
                    for (String block : conflictBlocks) {
                        allConflictBlocks.append("Conflict in file: ").append(conflictFile).append("\n");
                        allConflictBlocks.append(block).append("\n");
                    }
                    conflictFilesContent.add(allConflictBlocks.toString());
                }
                mergeResponse = MergeResponse.builder().conflictFilesContents(conflictFilesContent).files(conflictFiles).build();
                return mergeResponse;// 충돌 블록을 모두 합친 하나의 문자열 반환
            }
        }finally{
            deleteDirectoryRecursively(tempPath.toFile());
        }
        return null;
    }

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

    @Transactional
    public boolean doMerge(Repo repo, PullRequest pullRequest){
        if(pullRequest.isMergeable()){
            try {
                // Db에 저장된 정보를 가지고 PR 객체를 가져온다!
                GitHub gitHub = githubAppUtil.getGitHub(repo.getAccount().getInstallationId());
                GHRepository repository = gitHub.getRepository(repo.getFullName());
                GHPullRequest ghPullRequest = repository.getPullRequest(pullRequest.getGithubPrNumber());

                // github에서 가져온 pullRequest 객체로 삭제한다.
                ghPullRequest.merge("Merge PR #" + pullRequest.getGithubPrNumber() + " "+ pullRequest.getHead()+" -> "+ pullRequest.getBase() );

                log.info("Merge PR #" + pullRequest.getGithubPrNumber() + " "+ pullRequest.getHead()+" -> "+ pullRequest.getBase() );

                // 머지가 성공한 후에는 pullRequest 삭제 로직 추가
                pullRequestRepository.delete(pullRequest);
                return true;

            }catch(Exception e){
                e.printStackTrace();
            }
        }
        return false;
    }










}
