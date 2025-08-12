package com.ssafy.ottereview.mettingroom.controller;

import com.ssafy.ottereview.common.annotation.MvcController;
import com.ssafy.ottereview.mettingroom.dto.MeetingParticipantDto;
import com.ssafy.ottereview.mettingroom.service.MeetingParticipantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/meetings/{meetingroom-id}/members")
@Slf4j
@RequiredArgsConstructor
@MvcController
public class MeetingParticipantController {

    private final MeetingParticipantService meetingParticipantService;

    @GetMapping
    public ResponseEntity<List<MeetingParticipantDto>> getParticipants(
            @PathVariable("meetingroom-id") Long roomId
    ){
        List<MeetingParticipantDto> participants = meetingParticipantService.getParticipantsByRoomId(roomId);
        return ResponseEntity.ok(participants);
    }


}
