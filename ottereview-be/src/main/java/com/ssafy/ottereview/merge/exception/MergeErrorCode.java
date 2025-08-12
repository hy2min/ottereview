package com.ssafy.ottereview.merge.exception;

import com.ssafy.ottereview.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MergeErrorCode implements ErrorCode {
    MERGE_CHECK_FAILED("MERGE001", "머지체크 중 오류 발생", 500);

    private final String code;
    private final String message;
    private final int httpStatus;
}
