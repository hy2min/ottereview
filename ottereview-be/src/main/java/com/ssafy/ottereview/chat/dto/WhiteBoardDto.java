package com.ssafy.ottereview.chat.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WhiteBoardDto {
    public enum DrawType { DRAW, ERASE, CLEAR }
    private DrawType type;
    private Long senderId;
    private String senderName;
    private String senderProfileUrl;
    private String color;  // DRAW일 때만 사용, 나머지는 null 가능
    private String content; // CRDT update 데이터

    @Builder.Default
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy.MM.dd HH:mm:ss")
    private LocalDateTime timestamp = LocalDateTime.now();
}