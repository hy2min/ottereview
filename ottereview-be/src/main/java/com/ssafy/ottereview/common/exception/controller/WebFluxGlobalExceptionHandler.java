package com.ssafy.ottereview.common.exception.controller;

import com.ssafy.ottereview.common.annotation.WebFluxController;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.common.exception.CommonErrorCode;
import com.ssafy.ottereview.common.exception.ErrorCode;
import com.ssafy.ottereview.common.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.reactive.result.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Hidden
@RestControllerAdvice(annotations = WebFluxController.class)
public class WebFluxGlobalExceptionHandler extends ResponseEntityExceptionHandler {
    
    @ExceptionHandler(BusinessException.class)
    public Mono<ResponseEntity<ErrorResponse>> handleBusinessException(
            BusinessException e, ServerWebExchange exchange) {
        
        ErrorCode errorCode = e.getErrorCode();
        String path = exchange.getRequest().getPath().value();
        
        ErrorResponse errorResponse = new ErrorResponse(errorCode, path);
        
        return Mono.just(ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(errorResponse));
    }
    
    @Override
    protected Mono<ResponseEntity<Object>> handleExceptionInternal(
            Exception ex,
            Object body,
            HttpHeaders headers,
            HttpStatusCode statusCode,
            ServerWebExchange exchange) {
        
        String path = exchange.getRequest().getPath().value();
        
        // 매핑된 에러 코드 찾기
        ErrorCode errorCode = CommonErrorCode.INTERNAL_SERVER_ERROR;
        
        // 특별한 처리가 필요한 경우
        ErrorResponse errorResponse = new ErrorResponse(errorCode, path);
        
        return Mono.just(ResponseEntity.status(statusCode)
                .body(errorResponse));
    }
}
