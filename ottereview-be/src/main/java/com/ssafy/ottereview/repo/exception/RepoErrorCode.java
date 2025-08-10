package com.ssafy.ottereview.repo.exception;

import com.ssafy.ottereview.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RepoErrorCode implements ErrorCode {
    
    REPO_NOT_FOUND("REPO001", "Repository를 찾을 수 없습니다", 404),
    REPO_ALREADY_EXISTS("REPO002", "이미 존재하는 Repository입니다", 409),
    REPO_NOT_AUTHORIZED("REPO003", "Repository에 대한 권한이 없습니다", 403),
    REPO_INVALID_STATE("REPO004", "Repository의 상태가 유효하지 않습니다", 400);
    
    private final String code;
    private final String message;
    private final int httpStatus;
}
