package com.ssafy.ottereview.auth.jwt.interceptor;

import com.ssafy.ottereview.auth.jwt.util.JwtUtil;
import io.jsonwebtoken.Claims;
import java.util.Collections;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StompAuthChannelInterceptor implements ChannelInterceptor {
    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor
                .getAccessor(message, StompHeaderAccessor.class);

        // CONNECT 시 JWT 인증 - 헤더로 access token을 받아야 함
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                if (jwtUtil.validateToken(token)) {
                    Claims claims = jwtUtil.getClaims(token);

                    // Principal 생성 (userId를 이름으로 저장) -> 유저 조회는 컨트롤러에서 진행
                    UsernamePasswordAuthenticationToken user =
                            new UsernamePasswordAuthenticationToken(claims.getSubject(), null, Collections.emptyList());
                    log.debug("CONNECT Header: {}", authHeader);
                    accessor.setUser(user);
                } else {
                    throw new IllegalArgumentException("Invalid JWT Token");
                }
            } else {
                throw new IllegalArgumentException("Authorization header missing");
            }
        }
        return message;
    }
}
