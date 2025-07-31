package com.ssafy.ottereview.user.controller;

import com.ssafy.ottereview.mettingroom.dto.MyMeetingRoomResponseDto;
import com.ssafy.ottereview.user.dto.UserResponseDto;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.service.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService;

    @GetMapping()
    public ResponseEntity<List<UserResponseDto>> getAllUsers(){
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{user-id}")
    public ResponseEntity<UserResponseDto> getUser(@PathVariable("user-id") Long userId){
        return ResponseEntity.ok(userService.getUserResponseById(userId));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getMyInfo(@AuthenticationPrincipal CustomUserDetail userDetail) {
        return ResponseEntity.ok(userService.getUserResponseById(userDetail.getUser().getId()));
    }

    @GetMapping("/meetingroom")
    public ResponseEntity<List<MyMeetingRoomResponseDto>> getMyReposMeetingRooms(@AuthenticationPrincipal CustomUserDetail userDetail){
        return ResponseEntity.ok(userService.getMyReposMeetingRooms(userDetail.getUser().getId()));
    }


}
