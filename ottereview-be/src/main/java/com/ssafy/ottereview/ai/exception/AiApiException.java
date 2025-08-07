package com.ssafy.ottereview.ai.exception;

import lombok.Getter;
import org.apache.hc.core5.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public class AiApiException extends RuntimeException{

    private HttpStatusCode errorCode;

    public AiApiException(String message) {
        super(message);
    }

    public AiApiException(String message, HttpStatusCode errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
}
