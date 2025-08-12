package com.ssafy.ottereview.webhook.exception;

import com.ssafy.ottereview.common.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum WebhookErrorCode implements ErrorCode {
    WEBHOOK_UNSUPPORTED_EVENT("WEB001", "지원하지 않는 이벤트입니다.", 400),
    WEBHOOK_UNSUPPORTED_ACTION("WEB002", "지원하지 않는 액션입니다.", 400);
    
    private final String code;
    private final String message;
    private final int httpStatus;
}
