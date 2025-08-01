package com.ssafy.ottereview.mettingroom.service;

import com.ssafy.ottereview.mettingroom.dto.MeetingParticipantDto;

import java.util.List;

public interface MeetingParticipantService {
    List<MeetingParticipantDto> getParticipantsByRoomId(Long roomId);
}
