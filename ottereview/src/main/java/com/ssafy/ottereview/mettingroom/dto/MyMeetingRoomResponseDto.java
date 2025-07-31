package com.ssafy.ottereview.mettingroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class MyMeetingRoomResponseDto {
    private Long roomId;
    private String roomName;
    private boolean isInvited;
}
