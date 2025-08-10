package com.ssafy.ottereview.common.exception.controller;

import com.ssafy.ottereview.common.annotation.MvcController;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.common.exception.CommonErrorCode;
import com.ssafy.ottereview.common.exception.ErrorCode;
import com.ssafy.ottereview.common.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@Hidden
@RestControllerAdvice(annotations = MvcController.class)
public class MvcGlobalExceptionHandler extends ResponseEntityExceptionHandler {
    
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
            BusinessException e, HttpServletRequest request) {
        
        ErrorCode errorCode = e.getErrorCode();
        String path = request.getRequestURI();
        
        ErrorResponse errorResponse = new ErrorResponse(errorCode, path);
        
        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(errorResponse);
    }
    
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
        
        String path = ((ServletWebRequest) request).getRequest()
                .getRequestURI();
        
        // 매핑된 에러 코드 찾기
        ErrorCode errorCode = CommonErrorCode.INTERNAL_SERVER_ERROR;
        
        // 특별한 처리가 필요한 경우
        ErrorResponse errorResponse = new ErrorResponse(errorCode, path);
        
        return ResponseEntity.status(statusCode)
                .body(errorResponse);
    }
}
