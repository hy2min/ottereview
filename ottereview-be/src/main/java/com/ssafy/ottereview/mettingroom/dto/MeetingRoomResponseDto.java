package com.ssafy.ottereview.mettingroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class MeetingRoomResponseDto {
    private Long roomId;
    private String roomName;
    private Long ownerId;
    private List<MeetingParticipantDto> participants;
}
