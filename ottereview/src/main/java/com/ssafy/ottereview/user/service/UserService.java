package com.ssafy.ottereview.user.service;

import com.ssafy.ottereview.user.dto.UserResponseDto;
import com.ssafy.ottereview.user.entity.User;
import java.util.List;

public interface UserService {

    User getUserById(Long userId);

    UserResponseDto getUserResponseById(Long userId);

    void createUser(User user);

    List<UserResponseDto> getAllUsers();
}
