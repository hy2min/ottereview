package com.ssafy.ottereview.account.exception;

import com.ssafy.ottereview.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AccountErrorCode implements ErrorCode {
    
    USER_ACCOUNT_NOT_AUTHORIZED("ACCOUNT001", "사용자 인증에 실패했습니다", 401),
    ACCOUNT_NOT_FOUND("ACCOUNT002", "계정을 찾을 수 없습니다", 404);
    
    private final String code;
    private final String message;
    private final int httpStatus;
}
