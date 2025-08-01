package com.ssafy.ottereview.user.service;

import com.ssafy.ottereview.mettingroom.dto.MyMeetingRoomResponseDto;
import com.ssafy.ottereview.mettingroom.entity.MeetingParticipant;
import com.ssafy.ottereview.mettingroom.repository.MeetingParticipantRepository;
import com.ssafy.ottereview.user.dto.UserResponseDto;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final MeetingParticipantRepository meetingParticipantRepository;

    @Value("${openvidu.session.ttl-hours}")
    private long sessionTtlHours;

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
        LocalDateTime cutoff = LocalDateTime.now().minusHours(sessionTtlHours);
        List<MeetingParticipant> activeRooms =
                meetingParticipantRepository.findActiveMeetingRoomsByUserId(userId, cutoff);
        return activeRooms.stream()
                .map(MyMeetingRoomResponseDto::fromEntity)
                .toList();
    }

}
