package com.ssafy.ottereview.user.service;

import com.ssafy.ottereview.mettingroom.dto.MyMeetingRoomResponseDto;
import com.ssafy.ottereview.mettingroom.entity.MeetingParticipant;
import com.ssafy.ottereview.mettingroom.entity.MeetingRoom;
import com.ssafy.ottereview.mettingroom.repository.MeetingParticipantRepository;
import com.ssafy.ottereview.user.dto.UserResponseDto;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final MeetingParticipantRepository meetingParticipantRepository;

    @Override
    @Transactional(readOnly = true)
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDto getUserResponseById(Long userId) {
        return UserResponseDto.fromEntity(getUserById(userId));
    }

    @Override
    @Transactional
    public void createUser(User user) {
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponseDto::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MyMeetingRoomResponseDto> getMyReposMeetingRooms(Long userId) {
        List<MeetingParticipant> myRooms = meetingParticipantRepository.findMeetingRoomsByUserId(userId);
        return myRooms.stream()
                .map(MyMeetingRoomResponseDto::fromEntity)
                .toList();
    }

}
