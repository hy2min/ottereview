package com.ssafy.ottereview.ai.exception;

import com.ssafy.ottereview.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AiErrorCode implements ErrorCode {
    
    AI_API_ERROR("AI001", "AI API 호출 중 오류가 발생했습니다", 500);
    
    private final String code;
    private final String message;
    private final int httpStatus;
}
