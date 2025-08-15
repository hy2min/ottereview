package com.ssafy.ottereview.mettingroom.service;

import io.openvidu.java.client.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenViduServiceImpl implements OpenViduService{
    public final OpenVidu openVidu;

    // 미팅룸에 대한 세션 생성
    public String createSession() {
        try {
            Session session = openVidu.createSession();
            return session.getSessionId();
        } catch (OpenViduJavaClientException | OpenViduHttpException e) {
            log.error("Failed to create OpenVidu session", e);
            throw new IllegalStateException("세션 생성 실패", e);
        }
    }

    // customSessionId로 미팅룸 세션 생성
    public String createSession(String customSessionId) {
        try {
            SessionProperties properties = new SessionProperties.Builder()
                    .customSessionId(customSessionId)
                    .build();
            Session session = openVidu.createSession(properties);
            return session.getSessionId();
        } catch (OpenViduJavaClientException | OpenViduHttpException e) {
            log.error("Failed to create OpenVidu session with customSessionId: {}", customSessionId, e);
            throw new IllegalStateException("세션 생성 실패", e);
        }
    }

    // 미팅룸 접근을 위한 토큰 생성
    public String generateToken(String sessionId) {
        try {
            Session session = openVidu.getActiveSession(sessionId);
            if (session == null) {
                throw new IllegalArgumentException("session not exists");
            }
            ConnectionProperties properties = new ConnectionProperties.Builder().build(); // 토큰 객체 생성
            Connection connection = session.createConnection(properties); // 세션과 연결하여 토큰 생성
            return connection.getToken();
        } catch (OpenViduJavaClientException | OpenViduHttpException e) {
            log.error("Failed to generate token for session", e);
            throw new IllegalStateException("토큰 발급 실패", e);
        }
    }

    public boolean isSessionActive(String sessionId) {
        return openVidu.getActiveSession(sessionId) != null;
    }

}
