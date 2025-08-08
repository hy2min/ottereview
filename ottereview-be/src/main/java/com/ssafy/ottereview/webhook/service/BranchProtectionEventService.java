package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.branch.entity.Branch;
import com.ssafy.ottereview.branch.repository.BranchRepository;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.webhook.dto.BranchProtection;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    public void processBranchProtection(String payload) {
        log.debug("branch protect rule 추가 및 수정 로직 작동중");

        try {
            BranchProtection event = objectMapper.readValue(payload, BranchProtection.class);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(event);
            log.debug("DTO로 받은 RepositoryEventDto event: {}", formattedPayload);
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
            log.error("Error processing installation event", e);
        }
    }

    private void branchProtectionCreatedAndEdited(BranchProtection event) {
        Repo repo = repoRepository.findByRepoId(event.getRepository().getRepoId()).orElseThrow(() ->
                new IllegalArgumentException("Repository not found for id: " + event.getRepository().getRepoId())
        );
        List<Branch> branchList = branchRepository.findAllByRepo(repo);

        for(Branch branch : branchList) {
            log.info("branch 이름: {}", branch.getName());
            if(isMatchPattern(event.getRule().getName(),branch.getName())) {
                branch.settingMinApproveCnt(
                        event.getRule().getRequiredApprovingReviewCount());
                log.info("최소 승인 인원수 : {}",
                        event.getRule().getRequiredApprovingReviewCount());
                branchRepository.save(branch);
            }
        }
    }

    private void branchProtectionDeleted(BranchProtection event) {
        Repo repo = repoRepository.findByRepoId(event.getRepository().getRepoId()).orElseThrow(() ->
                new IllegalArgumentException("Repository not found for id: " + event.getRepository().getRepoId())
        );
        List<Branch> branchList = branchRepository.findAllByRepo(repo);
        for(Branch branch: branchList) {
            log.info("branch 이름: {}", branch.getName());
            if(isMatchPattern(event.getRule().getName(), branch.getName())) {
                branch.settingMinApproveCnt(0);
                log.info("설정된 최소 승인 인원수가 사라졌습니다.");
                branchRepository.save(branch);
            }
        }
    }

    private boolean isMatchPattern(String pattern, String branchName){
        AntPathMatcher matcher = new AntPathMatcher();
        matcher.setPathSeparator("/");
        return matcher.match(pattern, branchName);
    }


}
