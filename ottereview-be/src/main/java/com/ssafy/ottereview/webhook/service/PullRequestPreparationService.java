package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.webhook.dto.DiffHunk;
import com.ssafy.ottereview.webhook.dto.FileChangeInfo;
import com.ssafy.ottereview.webhook.dto.PullRequestPrepareData;
import com.ssafy.ottereview.webhook.dto.PushEventInfo;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHCommit;
import org.kohsuke.github.GHCompare.Commit;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class PullRequestPreparationService {
    
    private final ObjectMapper objectMapper;
    private final GithubApiClient githubApiClient;
    private final GitHubDiffService diffService;
    private final PullRequestPreparationRedisService prPreparationRedisService;
    
    public void preparePullRequestCreation(PushEventInfo pushInfo) {
        try {
            log.info("PR 생성 준비 for branch: {}", pushInfo.getBranchName());
            
            // installationId가 필요하므로 pushInfo에 추가하거나 별도로 조회
            Long installationId = pushInfo.getInstallationId();
            
            // 1. 커밋 정보 수집
            log.info("커밋 정보 수집 시작");
            List<Commit> commits = githubApiClient.getCommits(installationId, pushInfo.getRepoFullName(), pushInfo.getBeforeSha(), pushInfo.getAfterSha());
            
            // 2. 변경된 파일 목록 수집
            log.info("변경된 파일 목록 수집 시작");
            List<GHCommit.File> changedFiles = githubApiClient.getChangedFiles(installationId, pushInfo.getRepoFullName(), pushInfo.getBeforeSha(), pushInfo.getAfterSha());
            
            // 3. 파일별 상세 diff 정보 수집
            log.info("파일별 상세 diff 정보 수집 시작");
            List<FileChangeInfo> fileChanges = collectFileChanges(changedFiles);
            
            // 4. PR 생성 데이터
            PullRequestPrepareData prPrepareData = PullRequestPrepareData.builder()
                    .pushInfo(pushInfo)
                    .commits(commits)
                    .fileChanges(fileChanges)
                    .build();
            
            // 5. PR 데이터 JSON 구조 분석
            inspectPullRequestDataAsJson(prPrepareData);
            
            // 6. 실제 PR 생성 또는 임시 저장 (사용자 검토용)
//            prPreparationRedisService.savePullRequestData(prPrepareData);
            
        } catch (Exception e) {
            log.error("Error preparing PR creation", e);
        }
    }
    
    private List<FileChangeInfo> collectFileChanges(List<GHCommit.File> changedFiles) {
        List<FileChangeInfo> fileChanges = new ArrayList<>();
        
        for (GHCommit.File file : changedFiles) {
            try {
                // GHCommit.File 객체에서 기본 정보 추출
                FileChangeInfo.FileChangeInfoBuilder builder = FileChangeInfo.builder()
                        .filename(file.getFileName())
                        .status(file.getStatus())
                        .additions(file.getLinesAdded())
                        .deletions(file.getLinesDeleted())
                        .rawUrl(file.getRawUrl())
                        .blobUrl(file.getBlobUrl())
                        .changes(file.getLinesChanged());
                
                String detailedPatch = file.getPatch();
                if (detailedPatch != null && !detailedPatch.isEmpty()) {
                    List<DiffHunk> diffHunks = diffService.parseDiffHunks(detailedPatch);
                    builder.patch(detailedPatch)
                            .diffHunks(diffHunks);
                    
                }
                
                fileChanges.add(builder.build());
                
            } catch (Exception e) {
                log.error("Error processing file change: {}", file.getFileName(), e);
            }
        }
        
        return fileChanges;
    }
    
    private void inspectPullRequestDataAsJson(PullRequestPrepareData prData) {
        log.info("========================================");
        log.info("PullRequestData JSON 구조 분석");
        log.info("========================================");
        
        try {
            // 1. PushEventInfo JSON 확인
            log.info("1. PushEventInfo:");
            String pushInfoJson = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(prData.getPushInfo());
            log.info("\n{}", pushInfoJson);
            
            // 2. 각 Commit JSON 확인 (순환 참조 방지)
            log.info("2. Commits ({}개):", prData.getCommits()
                    .size());
            for (int i = 0; i < prData.getCommits()
                    .size(); i++) {
                Commit commit = prData.getCommits()
                        .get(i);
                try {
                    // Commit 객체의 기본 정보만 추출
                    Map<String, Object> commitInfo = new HashMap<>();
                    commitInfo.put("sha", commit.getSHA1());
                    commitInfo.put("url", commit.getUrl());
                    
                    // 추가 정보는 안전하게 가져오기
                    try {
                        commitInfo.put("message", commit.getCommit()
                                .getMessage());
                        commitInfo.put("author", commit.getCommitShortInfo()
                                .getAuthor()
                                .getName());
                        commitInfo.put("date", commit.getCommitShortInfo()
                                .getAuthor()
                                .getDate());
                    } catch (Exception e) {
                        commitInfo.put("detailError", e.getMessage());
                    }
                    
                    String commitJson = objectMapper.writerWithDefaultPrettyPrinter()
                            .writeValueAsString(commitInfo);
                    log.info("  커밋 {}:\n{}", i + 1, commitJson);
                    
                } catch (Exception e) {
                    log.error("  커밋 {} JSON 변환 실패: {}", i + 1, e.getMessage());
                }
            }
            
            // 3. FileChangeInfo JSON 확인
            log.info("3. FileChanges:");
            String fileChangesJson = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(prData.getFileChanges());
            log.info("\n{}", fileChangesJson);
            
        } catch (Exception e) {
            log.error("JSON 구조 분석 실패", e);
        }
        
        log.info("========================================");
    }
}
