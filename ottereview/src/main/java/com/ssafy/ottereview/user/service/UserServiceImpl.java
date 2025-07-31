package com.ssafy.ottereview.user.service;

import com.ssafy.ottereview.mettingroom.dto.MyMeetingRoomResponseDto;
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

    @Override
    @Transactional(readOnly = true)
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDto getUserResponseById(Long userId) {
        return toDto(getUserById(userId));
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
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MyMeetingRoomResponseDto> getMyReposMeetingRooms(Long id) {

    }

    private UserResponseDto toDto(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getGithubUsername(),
                user.getGithubEmail(),
                user.getProfileImageUrl(),
                user.getRewardPoints(),
                user.getUserGrade()
        );
    }


}
