package com.ssafy.ottereview.mettingroom.controller;

import com.ssafy.ottereview.common.annotation.MvcController;
import com.ssafy.ottereview.mettingroom.dto.JoinMeetingRoomResponseDto;
import com.ssafy.ottereview.mettingroom.dto.MeetingRoomRequestDto;
import com.ssafy.ottereview.mettingroom.dto.MeetingRoomResponseDto;
import com.ssafy.ottereview.mettingroom.service.MeetingRoomService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/meetings")
@Slf4j
@RequiredArgsConstructor
@MvcController
public class MeetingRoomController {
    private final MeetingRoomService meetingRoomService;

    @PostMapping
    public ResponseEntity<MeetingRoomResponseDto> createMeetingRoom(
            @RequestBody MeetingRoomRequestDto request,
            @AuthenticationPrincipal CustomUserDetail userDetail) {
        User user = userDetail.getUser();
        MeetingRoomResponseDto res = meetingRoomService.createMeetingRoom(request, user);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/{meetingroom-id}")
    public ResponseEntity<MeetingRoomResponseDto> getMeetingRoom(@PathVariable("meetingroom-id") Long roomId) {
        MeetingRoomResponseDto response = meetingRoomService.getMeetingRoomDetail(roomId);
        return ResponseEntity.ok(response);
    }


    @DeleteMapping("/{meetingroom-id}")
    public ResponseEntity<Void> closeMeetingRoom(@PathVariable("meetingroom-id") Long roomId, @AuthenticationPrincipal CustomUserDetail userDetail) {
        Long userId = userDetail.getUser().getId();
        meetingRoomService.closeMeetingRoom(userId, roomId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{meetingroom-id}/join")
    public ResponseEntity<JoinMeetingRoomResponseDto> joinMeetingRoom(@PathVariable("meetingroom-id") Long roomId, @AuthenticationPrincipal CustomUserDetail userDetail) {
        return ResponseEntity.ok(meetingRoomService.joinMeetingRoom(roomId, userDetail.getUser()));
    }

}
