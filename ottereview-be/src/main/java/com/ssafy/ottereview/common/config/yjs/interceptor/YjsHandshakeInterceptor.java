package com.ssafy.ottereview.common.config.yjs.interceptor;

import com.ssafy.ottereview.mettingroom.repository.MeetingRoomRepository;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

@Component
@RequiredArgsConstructor
@Slf4j
public class YjsHandshakeInterceptor implements HandshakeInterceptor {

    private final MeetingRoomRepository meetingRoomRepository;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        // URL 경로에서 roomId 추출 (/api/yjs/{roomId})
        String path = request.getURI().getPath();
        String roomId = path.substring(path.lastIndexOf('/') + 1);

        // DB에 방이 존재하는지 확인
        if (!meetingRoomRepository.existsById(Long.valueOf(roomId))) {
            log.warn("존재하지 않거나 종료된 roomId={} → WebSocket 연결 거부", roomId);
            return false;
        }

        attributes.put("roomId", roomId);
        log.info("Yjs WebSocket 연결 허용 - roomId: {}", roomId);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Exception exception) {
        if (exception != null) {
            log.error("WebSocket 핸드셰이크 중 에러 발생", exception);
        } else {
            log.info("WebSocket 핸드셰이크 완료 - 연결 성공");
        }
    }

}
