package com.ssafy.ottereview.email.service;

import com.ssafy.ottereview.email.dto.EmailRequestDto;
import com.ssafy.ottereview.email.dto.EmailResponseDto;

import com.ssafy.ottereview.email.util.EmailUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final EmailUtil emailUtil;

    @Value("${app.front.url}")
    private String frontUrl;

    /**
     * 채팅방 초대 메일 발송
     */
    @Async
    public void sendChatInvite(EmailRequestDto.ChatInvite invite) {
        try {
            // 초대 링크 생성
            String link = frontUrl + "/meetingroom/join?roomId=" + invite.getRoomId();

            // 메일 DTO 생성
            EmailResponseDto.EmailMessage emailMessage = EmailResponseDto.EmailMessage.builder()
                    .to(invite.getEmail()).subject("[ottereview] 채팅방 초대: " + invite.getRoomName())
                    .roomName(invite.getRoomName()).inviterName(invite.getInviterName())
                    .roomLink(link).build();

            // 메일 발송
            emailUtil.sendChatRoomInviteMail(emailMessage, "email/chat-invite");

        } catch (Exception e) {
            // 비동기 메서드 예외는 호출자에게 전달되지 않으므로 로그 필수
            log.error("채팅방 초대 메일 발송 실패 - 대상: {}, 에러: {}", invite.getEmail(), e.getMessage(), e);
        }
    }

}
