package com.ssafy.ottereview.s3.exception;

import com.ssafy.ottereview.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum S3ErrorCode implements ErrorCode {

    S3_PRESIGNED_URL_CREATE_FAILED("S3001", "Presigned URL 생성 실패하였습니다.", 500);

    private final String code;
    private final String message;
    private final int httpStatus;

}
