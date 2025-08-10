package com.ssafy.ottereview.common.config.yjs.config;

import com.ssafy.ottereview.common.config.yjs.handler.YjsWebSocketHandler;
import com.ssafy.ottereview.common.config.yjs.interceptor.YjsHandshakeInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class YjsWebSocketConfig implements WebSocketConfigurer {
    private final YjsWebSocketHandler yjsWebSocketHandler;
    private final YjsHandshakeInterceptor yjsHandshakeInterceptor;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(yjsWebSocketHandler, "/api/yjs/{roomId}")
                .addInterceptors(yjsHandshakeInterceptor)
                .setAllowedOriginPatterns("*"); // 운영에선 도메인 제한 권장
    }

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(512 * 1024);     // 512KB
        container.setMaxBinaryMessageBufferSize(2 * 1024 * 1024); // 2MB
        container.setMaxSessionIdleTimeout(600_000L);          // 10분
        return container;
    }

}
