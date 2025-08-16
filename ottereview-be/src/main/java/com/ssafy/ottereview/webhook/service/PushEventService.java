package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.webhook.controller.EventSendController;
import com.ssafy.ottereview.webhook.dto.PushEventDto;
import com.ssafy.ottereview.webhook.exception.WebhookErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class PushEventService {
    
    private final ObjectMapper objectMapper;
    private final EventSendController eventSendController;

    public void processPushEvent(String payload) {
        log.debug("Push Event 프로세스 실행");
        try {
            PushEventDto pushInfo = objectMapper.readValue(payload, PushEventDto.class);
            log.debug("Push Event 파싱 완료: {}", pushInfo);

            eventSendController.push(pushInfo.getSender().getId(), "push", pushInfo);
            
        } catch (Exception e) {
            log.error("Push Event 처리 실패", e);
            throw new BusinessException(WebhookErrorCode.WEBHOOK_UNSUPPORTED_ACTION);
        }
    }
    
}
