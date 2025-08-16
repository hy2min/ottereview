package com.ssafy.ottereview.chat.controller;

import com.ssafy.ottereview.chat.dto.ChatMessageDto;
import com.ssafy.ottereview.chat.dto.WhiteBoardDto;
import com.ssafy.ottereview.common.annotation.MvcController;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.service.UserService;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@MessageMapping("/meetings/{meetingroom-id}")
@Slf4j
@MvcController
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final UserService userService;

    // 클라이언트 → 서버: /app/meetings/{meetingroom-id}/chat
    // 서버 → 클라이언트: /topic/meetings/{meetingroom-id}/chat
    @MessageMapping("/chat")
    public void sendMessage(@DestinationVariable("meetingroom-id") String roomId, @Payload ChatMessageDto message, Principal principal) {
        log.debug("roomId={} message={}", roomId, message);
        Long userId = Long.valueOf(principal.getName());
        User user = userService.getUserById(userId);
        message = ChatMessageDto.builder()
                .type(message.getType())
                .senderId(user.getId())
                .senderName(user.getGithubUsername())
                .senderProfileUrl(user.getProfileImageUrl())
                .message(message.getMessage())
                .build();
        messagingTemplate.convertAndSend("/topic/meetings/" + roomId + "/chat", message);
    }

    // 클라이언트 → 서버: /app/meetings/{meetingroom-id}/whiteboard
    // 서버 → 클라이언트: /topic/meetings/{meetingroom-id}/whiteboard
    @MessageMapping("/whiteboard")
    public void drawWhiteBoard(@DestinationVariable("meetingroom-id") String roomId, @Payload WhiteBoardDto whiteBoard, Principal principal) {
        log.debug("roomId={} whiteBoard={}", roomId, whiteBoard);
        Long userId = Long.valueOf(principal.getName());
        User user = userService.getUserById(userId);
        whiteBoard = WhiteBoardDto.builder()
                .type(whiteBoard.getType())
                .senderId(user.getId())
                .senderName(user.getGithubUsername())
                .senderProfileUrl(user.getProfileImageUrl())
                .color(whiteBoard.getColor())
                .content(whiteBoard.getContent())
                .build();
        messagingTemplate.convertAndSend("/topic/meetings/" + roomId + "/whiteboard", whiteBoard);
    }
}
