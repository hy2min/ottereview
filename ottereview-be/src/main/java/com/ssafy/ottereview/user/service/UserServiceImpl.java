package com.ssafy.ottereview.user.service;

import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.entity.UserAccount;
import com.ssafy.ottereview.account.repository.UserAccountRepository;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.githubapp.util.GithubAppUtil;
import com.ssafy.ottereview.mettingroom.dto.MyMeetingRoomResponseDto;
import com.ssafy.ottereview.mettingroom.entity.MeetingParticipant;
import com.ssafy.ottereview.mettingroom.repository.MeetingParticipantRepository;
import com.ssafy.ottereview.user.dto.UserResponseDto;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHAppInstallation;
import org.kohsuke.github.GHOrganization;
import org.kohsuke.github.GHUser;
import org.kohsuke.github.GitHub;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final MeetingParticipantRepository meetingParticipantRepository;
    private final GithubApiClient githubApiClient;
    private final GithubAppUtil githubAppUtil;
    private final UserAccountRepository userAccountRepository;

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

    @Override
    public Map<Long, User> getAllUser() {
        List<User> dbUsers = userRepository.findAll();
        Map<Long, User> userMap = new HashMap<>();
        for (User u : dbUsers) {
            userMap.put(u.getGithubId(), u);
        }
        return userMap;
    }

    /**
     * 같은 Organziation에 있는 맴버를 github api를 통해 불러오는 method
     *
     * @param installationId
     * @return
     * @throws IOException
     */
    @Override
    public List<GHUser> fetchOrganizationMembers(Long installationId) throws IOException {
        GHAppInstallation githubAppUtilInstallation = githubAppUtil.getInstallation(installationId);
        String orgName = githubApiClient.getOrgName(githubAppUtilInstallation);
        GitHub gitHub = githubAppUtil.getGitHub(installationId);
        GHOrganization organization = gitHub.getOrganization(orgName);
        return organization.listMembers().toList();
    }

    private User findOrCreateUser(GHUser ghUser, Map<Long, User> existingUserMap,
            List<User> newUsers)
            throws IOException {
        User existingUser = existingUserMap.get(ghUser.getId());
        if (existingUser != null) {
            return existingUser;
        }

        User newUser = createUserFromGHUser(ghUser);
        newUsers.add(newUser);
        existingUserMap.put(ghUser.getId(), newUser);
        return newUser;
    }

    private User createUserFromGHUser(GHUser ghUser) throws IOException {
        return User.builder()
                .githubUsername(ghUser.getLogin())
                .githubId(ghUser.getId())
                .githubEmail(ghUser.getEmail())
                .type(ghUser.getType())
                .profileImageUrl(ghUser.getAvatarUrl())
                .userGrade("BASIC")
                .rewardPoints(0)
                .build();
    }

    private UserAccount createUserAccount(Account account, User user) {
        return UserAccount.builder()
                .account(account)
                .user(user)
                .build();
    }

    @Override
    public void getOrganizationMember(Long installationId, Account account) throws IOException {
        try {
            List<GHUser> orgMembers = fetchOrganizationMembers(installationId);
            Map<Long, User> userMap = getAllUser();

            List<User> newUsers = new ArrayList<>();
            List<UserAccount> newUserAccounts = new ArrayList<>();

            for (GHUser ghUser : orgMembers) {
                User user = findOrCreateUser(ghUser, userMap, newUsers);
                newUserAccounts.add(createUserAccount(account, user));
            }

            // saveAll로 성능 개선 (개별 저장으로 인해 N+1 문제를 야기해서 바꾸었다.)

            if (!newUsers.isEmpty()) {
                userRepository.saveAll(newUsers);
            }

            userAccountRepository.saveAll(newUserAccounts);
        } catch (IOException e) {
            log.error("조직 멤버 동기화 실패: installationId={}", installationId, e);
            throw e;
        }

    }

}
