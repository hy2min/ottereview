package com.ssafy.ottereview.user.service;

import com.ssafy.ottereview.user.entity.User;

public interface UserService {

    // DTO를 반환하도록 수정해주세요~

    User getUserById(Long userId);

    void createUser(User user);
}
