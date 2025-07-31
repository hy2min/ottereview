package com.ssafy.ottereview.mettingroom.dto;

import com.ssafy.ottereview.mettingroom.entity.MeetingParticipant;
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

    public static MyMeetingRoomResponseDto fromEntity(MeetingParticipant participant) {
        return new MyMeetingRoomResponseDto(
                participant.getMeetingRoom().getId(),
                participant.getMeetingRoom().getRoomName(),
                participant.isSendMail()
        );
    }
}
