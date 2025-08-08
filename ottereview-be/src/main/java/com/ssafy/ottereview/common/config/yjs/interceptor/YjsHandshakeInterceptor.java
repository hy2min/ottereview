package com.ssafy.ottereview.common.config.yjs.interceptor;
import com.ssafy.ottereview.auth.jwt.util.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class YjsHandshakeInterceptor implements HandshakeInterceptor {
    private final JwtUtil jwtUtil;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        String authHeader = request.getHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Authorization 헤더가 없거나 형식이 올바르지 않아 연결 거부");
            return false;
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            log.warn("유효하지 않은 JWT 토큰으로 연결 거부");
            return false;
        }
        try {
            Claims claims = jwtUtil.getClaims(token);
            String userId = claims.getSubject();
            attributes.put("userId", userId);
            attributes.put("token", token);
            log.info("WebSocket 연결 허용 - userId: {}", userId);
            return true;
        } catch (Exception e) {
            log.error("JWT 검증 중 오류 발생", e);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {
        if (exception != null) {
            log.error("WebSocket 핸드셰이크 중 에러 발생", exception);
        } else {
            log.info("WebSocket 핸드셰이크 완료 - 연결 성공");
        }
    }

}
