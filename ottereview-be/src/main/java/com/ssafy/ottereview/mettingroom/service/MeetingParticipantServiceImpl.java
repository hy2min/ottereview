package com.ssafy.ottereview.mettingroom.service;

import com.ssafy.ottereview.mettingroom.dto.MeetingParticipantDto;
import com.ssafy.ottereview.mettingroom.entity.MeetingRoom;
import com.ssafy.ottereview.mettingroom.repository.MeetingParticipantRepository;
import com.ssafy.ottereview.mettingroom.repository.MeetingRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MeetingParticipantServiceImpl implements MeetingParticipantService {
    private final MeetingParticipantRepository meetingParticipantRepository;
    private final MeetingRoomRepository meetingRoomRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MeetingParticipantDto> getParticipantsByRoomId(Long roomId) {
        // 방 조회
        MeetingRoom meetingRoom = meetingRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Meeting room not found"));
        
        // 참여자 조회
        List<MeetingParticipantDto> participants = meetingParticipantRepository.findByMeetingRoomId(roomId)
                .stream()
                .map(MeetingParticipantDto::fromEntity)
                .toList();

        return participants;
    }
}
