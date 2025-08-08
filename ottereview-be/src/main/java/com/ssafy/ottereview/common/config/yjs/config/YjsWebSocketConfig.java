package com.ssafy.ottereview.common.config.yjs.config;

import com.ssafy.ottereview.common.config.yjs.handler.YjsWebSocketHandler;
import com.ssafy.ottereview.common.config.yjs.interceptor.YjsHandshakeInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class YjsWebSocketConfig implements WebSocketConfigurer {
    private final YjsWebSocketHandler yjsWebSocketHandler;
    private final YjsHandshakeInterceptor yjsHandshakeInterceptor;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(yjsWebSocketHandler, "/api/yjs/{roomId}")
//                .addInterceptors(yjsHandshakeInterceptor)
                .setAllowedOriginPatterns("*"); // 운영에선 도메인 제한 권장
    }
}
