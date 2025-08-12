package com.ssafy.ottereview.user.service;

import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.mettingroom.dto.MyMeetingRoomResponseDto;
import com.ssafy.ottereview.user.dto.UserResponseDto;
import com.ssafy.ottereview.user.entity.User;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.kohsuke.github.GHUser;

public interface UserService {

    User getUserById(Long userId);

    UserResponseDto getUserResponseById(Long userId);

    void createUser(User user);

    List<UserResponseDto> getAllUsers();

    List<MyMeetingRoomResponseDto> getMyReposMeetingRooms(Long id);

    Map<Long, User> getAllUser();

    void getOrganizationMember(Long installationId, Account account) throws IOException;

    List<GHUser> fetchOrganizationMembers(Long installationId) throws IOException;
}
