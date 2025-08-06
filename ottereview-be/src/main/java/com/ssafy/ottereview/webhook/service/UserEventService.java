package com.ssafy.ottereview.webhook.service;

import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import com.ssafy.ottereview.webhook.dto.UserWebhookInfo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor
public class UserEventService {

    private final UserRepository userRepository;

    public User registerUser(UserWebhookInfo user) {
        User newUser = User.builder()
                .githubId(user.getId())
                .githubUsername(user.getLogin())
                .githubEmail(user.getEmail() != null ? user.getEmail() : null)
                .type(user.getType())
                .profileImageUrl(user.getAvatarUrl() != null ? user.getAvatarUrl()
                        .toString() : null)
                .rewardPoints(0)
                .userGrade("BASIC")
                .build();

        return userRepository.save(newUser);
    }
}
