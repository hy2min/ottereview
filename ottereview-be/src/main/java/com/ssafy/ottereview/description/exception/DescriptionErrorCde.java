package com.ssafy.ottereview.description.exception;

import com.ssafy.ottereview.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum DescriptionErrorCde implements ErrorCode {

    DESCRIPTION_NOT_FOUND("D001", "설명을 찾을 수 없습니다", 404),
    DESCRIPTION_ALREADY_EXISTS("D002", "이미 존재하는 설명입니다", 409),
    DESCRIPTION_NOT_AUTHORIZED("D003", "설명에 대한 권한이 없습니다", 403),
    DESCRIPTION_INVALID_STATE("D004", "설명의 상태가 유효하지 않습니다", 400),
    DESCRIPTION_VALIDATION_FAILED("D005", "설명 검증에 실패했습니다.", 400),
    DESCRIPTION_CREATE_FAILED("D006", "설명 생성에 실패했습니다", 500);

    private final String code;
    private final String message;
    private final int httpStatus;
}
