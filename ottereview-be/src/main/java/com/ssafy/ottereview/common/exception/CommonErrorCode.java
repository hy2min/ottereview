package com.ssafy.ottereview.common.exception;

import lombok.Getter;

@Getter
public enum CommonErrorCode implements ErrorCode {

    INVALID_INPUT_VALUE("C001", "Invalid input value", 400),
    METHOD_NOT_ALLOWED("C002", "Method not allowed", 405),
    ENTITY_NOT_FOUND("C003", "Entity not found", 404),
    INTERNAL_SERVER_ERROR("C004", "Internal server error", 500),
    UNAUTHORIZED("C005", "Unauthorized access", 401),
    FORBIDDEN("C006", "Forbidden access", 403);

    private final String code;
    private final String message;
    private final int httpStatus;

    CommonErrorCode(String code, String message, int httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
