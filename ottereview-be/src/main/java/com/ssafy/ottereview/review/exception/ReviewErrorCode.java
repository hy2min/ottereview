package com.ssafy.ottereview.review.exception;

import com.ssafy.ottereview.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReviewErrorCode implements ErrorCode {
    
    REVIEW_NOT_FOUND("R001", "리뷰를 찾을 수 없습니다", 404),
    REVIEW_ALREADY_EXISTS("R002", "이미 존재하는 리뷰입니다", 409);
    
    private final String code;
    private final String message;
    private final int httpStatus;
}
