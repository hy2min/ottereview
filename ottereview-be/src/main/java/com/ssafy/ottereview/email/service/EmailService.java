package com.ssafy.ottereview.email.service;

import com.ssafy.ottereview.email.dto.EmailRequestDto;

public interface EmailService {
    
    void sendChatInvite(EmailRequestDto.ChatInvite invite);
}
