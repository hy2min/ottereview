package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.branch.entity.Branch;
import com.ssafy.ottereview.branch.repository.BranchRepository;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.githubapp.util.GithubAppUtil;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.webhook.dto.BranchProtection;
import com.ssafy.ottereview.webhook.exception.WebhookErrorCode;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHBranchProtection;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.AntPathMatcher;

@Transactional
@Service
@Slf4j
@RequiredArgsConstructor
public class BranchProtectionEventService {

    private final ObjectMapper objectMapper;
    private final RepoRepository repoRepository;
    private final BranchRepository branchRepository;
    private final GithubAppUtil githubAppUtill;

    public void processBranchProtection(String payload) {
        log.debug("branch protect rule 추가 및 수정 로직 작동중");

        try {
            BranchProtection event = objectMapper.readValue(payload, BranchProtection.class);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(event);
            log.debug("DTO로 받은 BranchProtection event: {}", formattedPayload);
            switch (event.getAction()) {
                case "created":
                    log.info("created event handler start");
                    branchProtectionCreatedAndEdited(event);
                    break;
                case "edited":
                    log.info("edited event handler start");
                    branchProtectionCreatedAndEdited(event);
                    break;
                case "deleted":
                    log.info("deleted event handler start");
                    branchProtectionDeleted(event);
                    break;
                default:
                    log.warn("Unhandled action: {}", event.getAction());
            }
        } catch (Exception e) {
            throw new BusinessException(WebhookErrorCode.WEBHOOK_UNSUPPORTED_ACTION);
        }
    }

    private void branchProtectionCreatedAndEdited(BranchProtection event)  {
        try {
            Repo repo = repoRepository.findByRepoId(event.getRepository().getRepoId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Repository not found for id: " + event.getRepository()
                                            .getRepoId())
                    );
            List<Branch> branchList = branchRepository.findAllByRepo(repo);
            GitHub gitHub = githubAppUtill.getGitHub(repo.getAccount().getInstallationId());
            GHRepository ghRepository = gitHub.getRepository(repo.getFullName());

            for (Branch branch : branchList) {
                log.info("branch 이름: {}", branch.getName());
                if (isMatchPattern(event.getRule().getName(), branch.getName())) {
                    GHBranchProtection protection = ghRepository.getBranch(branch.getName()).getProtection();
                    if (protection != null && protection.getRequiredReviews().getRequiredReviewers() >=1 ) {
                        // pull request review 요구사항만 제거
                        ghRepository.getBranch(branch.getName())
                                .enableProtection()
                                .dismissStaleReviews(false)// 승인자 수를 0으로 설정
                                .requiredReviewers(0)
                                .enable();
                        branch.settingMinApproveCnt(0);
                        branchRepository.save(branch);
                    }
                    log.info("최소 승인 인원수 : {}",
                            event.getRule().getRequiredApprovingReviewCount());
                }
            }
        }catch(Exception e){
            e.printStackTrace();
        }
    }

    private void branchProtectionDeleted(BranchProtection event) {
        try {
            Repo repo = repoRepository.findByRepoId(event.getRepository().getRepoId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Repository not found for id: " + event.getRepository()
                                            .getRepoId())
                    );
            List<Branch> branchList = branchRepository.findAllByRepo(repo);
            for (Branch branch : branchList) {
                log.info("branch 이름: {}", branch.getName());
                if (isMatchPattern(event.getRule().getName(), branch.getName())) {
                    branch.settingMinApproveCnt(0);
                    log.info("설정된 최소 승인 인원수가 사라졌습니다.");
                    branchRepository.save(branch);
                }
            }
        }catch(Exception e){

        }
    }

    private boolean isMatchPattern(String pattern, String branchName) {
        // ** 패턴을 단일 레벨로 제한 처리
        if (pattern.endsWith("/**")) {
            String basePattern = pattern.substring(0, pattern.length() - 3); // "/**" 제거

            // 기본 패턴으로 시작하는지 확인
            if (branchName.startsWith(basePattern + "/")) {
                // 기본 패턴 뒤의 경로 추출
                String suffixPath = branchName.substring(basePattern.length() + 1);

                // 빈 경로는 허용하지 않음
                if (suffixPath.isEmpty()) {
                    return false;
                }

                // "/" 문자가 포함되어 있으면 여러 레벨이므로 false
                return !suffixPath.contains("/");
            }
            return false;
        }

        // 중간에 ** 패턴이 있는 경우도 처리
        if (pattern.contains("/**")) {
            return handleMiddleDoubleWildcard(pattern, branchName);
        }

        // 다른 패턴들은 기본 AntPathMatcher 사용
        AntPathMatcher matcher = new AntPathMatcher();
        matcher.setPathSeparator("/");
        return matcher.match(pattern, branchName);
    }

    private boolean handleMiddleDoubleWildcard(String pattern, String branchName) {
        // "prefix/**/suffix" 형태의 패턴 처리
        String[] parts = pattern.split("/\\*\\*/");

        if (parts.length == 2) {
            String prefix = parts[0];
            String suffix = parts[1];

            if (!branchName.startsWith(prefix + "/")) {
                return false;
            }

            if (!branchName.endsWith("/" + suffix)) {
                return false;
            }

            // 중간 부분 추출
            String middlePart = branchName.substring(
                    prefix.length() + 1,
                    branchName.length() - suffix.length() - 1
            );

            // 중간 부분이 단일 레벨인지 확인
            return !middlePart.contains("/");
        }

        return false;
    }

}
