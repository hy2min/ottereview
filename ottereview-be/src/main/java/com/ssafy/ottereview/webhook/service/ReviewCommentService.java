package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.webhook.dto.ReviewCommentEventDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class ReviewCommentService {
    
    private final ObjectMapper objectMapper;
    
    public void processReviewCommentEvent(String payload) {
        try {
            ReviewCommentEventDto event = objectMapper.readValue(payload, ReviewCommentEventDto.class);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(event);
            log.debug("DTO로 받은 PullRequestEventService event: {}", formattedPayload);
            
            switch (event.getAction()) {
                
                case "created":
                    log.debug("리뷰 코멘트가 생성될 경우 발생하는 callback");
                    break;
                    
                case "edited":
                    log.debug("리뷰 코멘트가 생성 및 수정될 경우 발생하는 callback");
                    break;
                    
                case "deleted":
                    log.debug("리뷰 코멘트가 삭제 될 경우 발생하는 callback");
                    break;
                
                default:
                    log.warn("Unhandled action: {}", event.getAction());
            }
        } catch (Exception e) {
            log.error("Error processing installation event", e);
        }
    }
}
