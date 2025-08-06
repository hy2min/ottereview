package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.account.repository.AccountRepository;
import com.ssafy.ottereview.webhook.dto.InstallationEventDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@Service
@Slf4j
@RequiredArgsConstructor
public class InstallationEventService {
    
    private final ObjectMapper objectMapper;
    private final AccountRepository accountRepository;
    
    public void processInstallationEvent(String payload) {
        
        try {
            InstallationEventDto event = objectMapper.readValue(payload, InstallationEventDto.class);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(event);
            log.debug("DTO로 받은 installation event: {}", formattedPayload);
            
            switch (event.getAction()) {
                case "created":
                    log.debug("Installation created event received");
                    break;
                
                case "deleted":
                    log.debug("Installation deleted event received");
                    accountRepository.deleteByGithubId(event.getInstallation()
                            .getAccount()
                            .getId());
                    break;
                case "updated":
                    log.debug("Installation updated event received");
                    break;
                
                default:
                    log.warn("Unhandled action: {}", event.getAction());
            }
        } catch (Exception e) {
            log.error("Error processing installation event", e);
        }
    }
    
    public void processInstallationRepositoriesEvent(String payload) {
        log.debug("Installation Repositories Event 프로세스 실행");
        try {
            JsonNode json = objectMapper.readTree(payload);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(json);
            
            log.debug("전체 페이로드 출력:\n{}", formattedPayload);
            
            
        } catch (Exception e) {
            log.error("Error processing push event", e);
        }
    }
}
