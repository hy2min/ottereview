package com.ssafy.ottereview.mettingroom.service;

import com.ssafy.ottereview.mettingroom.dto.MeetingRoomRequestDto;
import com.ssafy.ottereview.mettingroom.dto.MeetingRoomResponseDto;
import com.ssafy.ottereview.user.entity.User;

public interface MeetingRoomService {
    MeetingRoomResponseDto createMeetingRoom(MeetingRoomRequestDto request, User user);

    MeetingRoomResponseDto getMeetingRoomDetail(Long roomId);

    void closeMeetingRoom(Long userId, Long roomId);
}
