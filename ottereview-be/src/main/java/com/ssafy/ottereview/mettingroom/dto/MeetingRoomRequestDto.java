package com.ssafy.ottereview.mettingroom.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
public class MeetingRoomRequestDto {
    private Long prId;
    private String roomName;
    private List<Long> inviteeIds;
}
