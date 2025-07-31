package com.ssafy.ottereview.mettingroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class JoinMeetingRoomResponseDto {
    private Long roomId;
    private String openviduToken;
}
