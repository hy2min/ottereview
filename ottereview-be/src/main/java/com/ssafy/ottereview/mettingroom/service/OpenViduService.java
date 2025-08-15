package com.ssafy.ottereview.mettingroom.service;

public interface OpenViduService {
    String createSession();
    String createSession(String customSessionId);

    String generateToken(String sessionId);

    boolean isSessionActive(String sessionId);

}
