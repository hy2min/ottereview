package com.ssafy.ottereview.user.exception;

import com.ssafy.ottereview.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserErrorCode implements ErrorCode {
    USER_NOT_FOUND("USER001", "사용자를 찾을 수 없습니다", 404),
    USER_ALREADY_EXISTS("USER002", "이미 존재하는 사용자입니다", 409),
    USER_NOT_AUTHORIZED("USER003", "사용자에 대한 권한이 없습니다", 403),
    USER_INVALID_STATE("USER004", "사용자의 상태가 유효하지 않습니다", 400),
    USER_REGISTRATION_FAILED("USER005", "사용자 등록에 실패했습니다", 500);
    
    private final String code;
    private final String message;
    private final int httpStatus;
}
