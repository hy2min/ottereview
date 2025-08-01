package com.ssafy.ottereview.mettingroom.service;

public interface OpenViduService {
    String createSession();

    String generateToken(String sessionId);

    boolean isSessionActive(String sessionId);

}
