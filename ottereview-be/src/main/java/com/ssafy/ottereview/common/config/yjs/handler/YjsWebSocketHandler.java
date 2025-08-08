package com.ssafy.ottereview.common.config.yjs.handler;

import java.nio.ByteBuffer;
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
    private static final String ATTR_ROOM_ID = "roomId";
    private static final String ATTR_SEND_LOCK = "__send_lock";

    @Override
    public void afterConnectionEstablished(WebSocketSession session){
        String roomId = extractRoomId(session);
        log.info("YJS WebSocket 연결됨 - roomId: {}, sessionId: {}", roomId, session.getId());

        // 해당 방에 세션 추가
        roomSessions.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(session);
        session.getAttributes().put(ATTR_ROOM_ID, roomId);
        // 세션별 전송 락 객체
        session.getAttributes().putIfAbsent(ATTR_SEND_LOCK, new Object());
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message){
        String roomId = (String) session.getAttributes().get(ATTR_ROOM_ID);

        if (roomId == null) {
            log.warn("roomId가 없어서 메시지 브로드캐스트 불가 - sessionId: {}", session.getId());
            return;
        }

        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null || sessions.isEmpty()) {
            log.error("방 [{}]에 활성화된 세션이 없습니다 - sessionId: {}", roomId, session.getId());
            return;
        }

        // 원본 payload는 한 번만 읽고, 각 수신자에 대해 read-only buffer 새로 생성
        ByteBuffer payload = message.getPayload();
        for (WebSocketSession s : sessions) {
            if (s == session || !s.isOpen()) continue;
            try {
                // 세션 단일 전송 보장
                Object lock = s.getAttributes().get(ATTR_SEND_LOCK);
                if (lock == null) {
                    lock = new Object();
                    s.getAttributes().put(ATTR_SEND_LOCK, lock);
                }
                ByteBuffer dup = payload.asReadOnlyBuffer();
                BinaryMessage copy = new BinaryMessage(dup);

                synchronized (lock) {
                    s.sendMessage(copy);
                }
            } catch (IOException e) {
                log.error("메시지 전송 실패 - roomId: {}, toSessionId: {}", roomId, s.getId(), e);
                safeClose(s, CloseStatus.SERVER_ERROR);
                sessions.remove(s);
            } catch (IllegalStateException ise) {
                // concurrent send 등
                log.warn("세션 전송 상태 오류 - toSessionId: {}, msg: {}", s.getId(), ise.getMessage());
            }
        }
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
        safeClose(session, CloseStatus.SERVER_ERROR);
        // 세션 정리
        String roomId = (String) session.getAttributes().get(ATTR_ROOM_ID);
        if (roomId != null) {
            Set<WebSocketSession> sessions = roomSessions.get(roomId);
            if (sessions != null) sessions.remove(session);
        }
    }

    private void safeClose(WebSocketSession s, CloseStatus status) {
        try {
            if (s.isOpen()) s.close(status);
        } catch (IOException ignore) {}
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
        for (int i = segments.length - 1; i >= 0; i--) {
            if (!segments[i].isEmpty()) {
                return segments[i];
            }
        }
        throw new IllegalArgumentException("Invalid WebSocket path: roomId is missing");
    }

}
