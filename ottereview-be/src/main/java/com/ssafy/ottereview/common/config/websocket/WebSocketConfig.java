package com.ssafy.ottereview.common.config.websocket;

import com.ssafy.ottereview.auth.jwt.interceptor.StompAuthChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * web socket 통신 중 STOMP를 위한 설정입니다.
 */
@Configuration
@EnableWebSocketMessageBroker //STOMP 프로토콜을 사용해 WebSocket 메시징 활성화
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic"); //서버 → 클라이언트로 메시지를 보낼 때 사용하는 경로
        config.setApplicationDestinationPrefixes("/app"); // 클라이언트 → 서버로 메시지를 보낼 때 사용하는 경로
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws") // WebSocket 연결 엔드포인트 등록
                .setAllowedOriginPatterns("*")  // 크로스 도메인 허용
                .withSockJS();                  // WebSocket 미지원 브라우저 호환성을 위해 SockJS 활성화
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor); // Interceptor 등록
    }
}
