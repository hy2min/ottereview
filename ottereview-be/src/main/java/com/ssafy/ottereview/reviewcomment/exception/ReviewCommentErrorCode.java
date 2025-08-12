package com.ssafy.ottereview.reviewcomment.exception;

import com.ssafy.ottereview.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReviewCommentErrorCode implements ErrorCode {
    
    REVIEW_COMMENT_NOT_FOUND("RC001", "리뷰 코멘트를 찾을 수 없습니다", 404),
    REVIEW_COMMENT_ALREADY_EXISTS("RC002", "이미 존재하는 리뷰 코멘트입니다", 409),
    REVIEW_COMMENT_NOT_AUTHORIZED("RC003", "리뷰 코멘트에 대한 권한이 없습니다", 403),
    REVIEW_COMMENT_INVALID_STATE("RC004", "리뷰 코멘트의 상태가 유효하지 않습니다", 400),
    REVIEW_COMMENT_VALIDATION_FAILED("RC005", "리뷰 코멘트 검증에 실패했습니다.", 400),
    REVIEW_COMMENT_CREATE_FAILED("RC006", "리뷰 코멘트 생성에 실패했습니다", 500),
    REVIEW_COMMENT_UPDATE_FAILED("RC007", "리뷰 코멘트 업데이트에 실패했습니다", 500);
    
    private final String code;
    private final String message;
    private final int httpStatus;
}
