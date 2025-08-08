package com.ssafy.ottereview.common.config.yjs.handler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class YjsWebSocketHandler extends BinaryWebSocketHandler {
    /**
     * 방(roomId) 별 WebSocket 세션 그룹 관리
     */
    private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session){
        String roomId = extractRoomId(session);
        log.info("YJS WebSocket 연결됨 - roomId: {}, sessionId: {}", roomId, session.getId());

        // 해당 방에 세션 추가
        roomSessions.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(session);
        session.getAttributes().put("roomId", roomId);
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message){
        String roomId = (String) session.getAttributes().get("roomId");

        if (roomId == null) {
            log.warn("roomId가 없어서 메시지 브로드캐스트 불가 - sessionId: {}", session.getId());
            throw new IllegalStateException("WebSocket 세션에 roomId가 없습니다.");
        }

        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null || sessions.isEmpty()) {
            log.error("방 [{}]에 활성화된 세션이 없습니다 - sessionId: {}", roomId, session.getId());
            throw new IllegalStateException("활성 클라이언트가 없는 방: " + roomId);
        }

        sessions.parallelStream()
                .filter(s -> !s.equals(session) && s.isOpen())
                .forEach(s -> {
                    try {
                        s.sendMessage(message);
                    } catch (IOException e) {
                        log.error("메시지 전송 실패 - sessionId: {}", s.getId(), e);
                        sessions.remove(s);
                    }
                });
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status){
        String roomId = (String) session.getAttributes().get("roomId");

        if (roomId != null) {
            Set<WebSocketSession> sessions = roomSessions.get(roomId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    roomSessions.remove(roomId);
                    log.info("roomId {}의 모든 세션 종료, 방 제거", roomId);
                }
            }
        }

        log.info("YJS WebSocket 연결 종료 - sessionId: {}, status: {}", session.getId(), status);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("YJS WebSocket 전송 오류 - sessionId: {}", session.getId(), exception);
        if (session.isOpen()) {
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    /**
     * URI에서 roomId 추출
     */
    private String extractRoomId(WebSocketSession session) {
        String path = session.getUri().getPath();
        if (path == null) {
            throw new IllegalArgumentException("WebSocket URI path is null");
        }
        String[] segments = path.split("/");
        if (segments.length < 3 || segments[2].isEmpty()) {
            throw new IllegalArgumentException("Invalid WebSocket path: roomId is missing");
        }
        return segments[2];
    }

}
