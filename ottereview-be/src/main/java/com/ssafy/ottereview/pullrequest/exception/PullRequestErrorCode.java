package com.ssafy.ottereview.pullrequest.exception;

import com.ssafy.ottereview.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PullRequestErrorCode implements ErrorCode {
    PR_NOT_FOUND("PR001", "PullRequest를 찾을 수 없습니다", 404),
    PR_ALREADY_EXISTS("PR002", "이미 존재하는 PullRequest입니다", 409),
    PR_NOT_AUTHORIZED("PR003", "PullRequest에 대한 권한이 없습니다", 403),
    PR_INVALID_STATE("PR004", "PullRequest의 상태가 유효하지 않습니다", 400),
    PR_VALIDATION_FAILED("PR005", "PullRequest 검증에 실패했습니다.", 400),
    PR_CREATE_FAILED("PR006", "PullRequest 생성에 실패했습니다", 500),
    PR_SYNC_FAILED("PR007", "PullRequest 동기화에 실패했습니다", 500),
    PR_ALREADY_OPEN("PR008", "이미 열려 있는 PullRequest가 존재합니다", 409);

    private final String code;
    private final String message;
    private final int httpStatus;
}
