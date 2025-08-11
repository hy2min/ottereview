package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.webhook.dto.BranchProtection;
import com.ssafy.ottereview.webhook.dto.RepoEventDto;
import com.ssafy.ottereview.webhook.exception.WebhookErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@Service
@Slf4j
@RequiredArgsConstructor
public class RepoEventService {
    private final ObjectMapper objectMapper;
    private final RepoRepository repoRepository;

    public void processRepo(String payload){
        log.debug("Repo public private 변경");
        try{
            RepoEventDto event = objectMapper.readValue(payload, RepoEventDto.class);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(event);
            log.debug("DTO로 받은 Repository event: {}", formattedPayload);
            switch(event.getAction()){
                case "publicized":
                    log.info("Repo publicized handler start");
                    RepoPublicized(event);
                    break;
                case "privatized":
                    log.info("Repo privatized handler start");
                    RepoPrivatized(event);
                    break;
                default:
                    log.warn("Unhandled action: {}", event.getAction());
            }
        } catch (Exception e) {
            throw new BusinessException(WebhookErrorCode.WEBHOOK_UNSUPPORTED_ACTION);
        }
    }

    public void RepoPublicized(RepoEventDto event){
        Repo repo =  repoRepository.findByRepoId(event.getRepository().getRepoId()).orElseThrow(()->
                new IllegalArgumentException("Repository not found for id: " + event.getRepository().getRepoId())
        );
        log.info("Repo public으로 변경중");
        repo.changeOpenType(false);
        repoRepository.save(repo);
    }
    public void RepoPrivatized(RepoEventDto event){
        Repo repo =  repoRepository.findByRepoId(event.getRepository().getRepoId()).orElseThrow(()->
                new IllegalArgumentException("Repository not found for id: " + event.getRepository().getRepoId())
        );
        log.info("Repo private으로 변경중");
        repo.changeOpenType(true);
        repoRepository.save(repo);
    }

}
