package com.ssafy.ottereview.mettingroom.service;

import com.ssafy.ottereview.mettingroom.dto.JoinMeetingRoomResponseDto;
import com.ssafy.ottereview.mettingroom.dto.MeetingParticipantDto;
import com.ssafy.ottereview.mettingroom.dto.MeetingRoomRequestDto;
import com.ssafy.ottereview.mettingroom.dto.MeetingRoomResponseDto;
import com.ssafy.ottereview.mettingroom.entity.MeetingParticipant;
import com.ssafy.ottereview.mettingroom.entity.MeetingRoom;
import com.ssafy.ottereview.mettingroom.repository.MeetingParticipantRepository;
import com.ssafy.ottereview.mettingroom.repository.MeetingRoomRepository;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.repo.service.RepoService;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MeetingRoomServiceImpl implements MeetingRoomService {
    private final MeetingRoomRepository meetingRoomRepository;
    private final PullRequestRepository pullRequestRepository;
    private final UserRepository userRepository;
    private final RepoRepository repoRepository;
    private final OpenViduService openViduService;
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String SESSION_KEY_PREFIX = "meeting:session:";

    @Value("${openvidu.session.ttl-hours}")
    private long sessionTtlHours;

    @Override
    @Transactional
    public MeetingRoomResponseDto createMeetingRoom(MeetingRoomRequestDto request, User user) {
        // Pull Request 조회
        PullRequest pullRequest = pullRequestRepository.findById(request.getPrId())
                .orElseThrow(() -> new IllegalArgumentException("PR not found"));

        // MeetingRoom 생성
        MeetingRoom room = MeetingRoom.builder()
                .roomName(request.getRoomName())
                .pullRequest(pullRequest)
                .build();

        // Owner 참여자 추가
        MeetingParticipant owner = MeetingParticipant.builder()
                .user(user)
                .isOwner(true)
                .build();
        room.addParticipant(owner);

        // 초대 대상 추가
        if (request.getInviteeIds() != null && !request.getInviteeIds().isEmpty()) {
            List<User> invitees = userRepository.findAllById(request.getInviteeIds());

            // 유효하지 않은 ID 체크
            if (invitees.size() != request.getInviteeIds().size()) {
                throw new IllegalArgumentException("Invalid user exists.");
            }

            for (User invitee : invitees) {
                MeetingParticipant participant = MeetingParticipant.builder()
                        .user(invitee)
                        .isOwner(false)
                        .build();
                room.addParticipant(participant);
            }
        }

        // Cascade로 참여자까지 함께 저장됨
        meetingRoomRepository.save(room);

        // OpenVidu 세션 생성 & Redis 저장
        String sessionId = openViduService.createSession();
        redisTemplate.opsForValue().set(SESSION_KEY_PREFIX + room.getId(), sessionId, sessionTtlHours, TimeUnit.HOURS);

        // DTO 변환 
        List<MeetingParticipantDto> participantDtos = room.getParticipants().stream()
                .map(MeetingParticipantDto::fromEntity)
                .collect(Collectors.toList());

        return new MeetingRoomResponseDto(room.getId(), user.getId(), participantDtos);
    }

    @Override
    @Transactional(readOnly = true)
    public MeetingRoomResponseDto getMeetingRoomDetail(Long roomId) {
        // Room 조회
        MeetingRoom room = meetingRoomRepository.findByIdWithParticipantsAndUsers(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));

        // 참여자 조회
        List<MeetingParticipantDto> participantDtos = room.getParticipants().stream()
                .map(MeetingParticipantDto::fromEntity)
                .toList();

        // Owner ID
        Long ownerId = room.getParticipants().stream()
                .filter(MeetingParticipant::isOwner)
                .map(p -> p.getUser().getId())
                .findFirst()
                .orElse(null);

        return new MeetingRoomResponseDto(room.getId(), ownerId, participantDtos);
    }

    @Override
    @Transactional
    public void closeMeetingRoom(Long userId, Long roomId) {
        // Room 조회
        MeetingRoom room = meetingRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));

        // owner 조회
        Long ownerId = room.getParticipants().stream()
                .filter(MeetingParticipant::isOwner)
                .map(p -> p.getUser().getId())
                .findFirst()
                .orElse(null);

        if (!Objects.equals(ownerId, userId)) {
            throw new AccessDeniedException("not the owner of this room.");
        }
        // Redis 세션 삭제
        String key = SESSION_KEY_PREFIX + roomId;
        String sessionId = (String) redisTemplate.opsForValue().get(key);
        redisTemplate.delete(key);
        // openvidu 세션은 사람이 없으면 자동 삭제 됨
        // cascade로 참여자 같이 삭제
        meetingRoomRepository.delete(room);
    }

    @Override
    @Transactional
    public JoinMeetingRoomResponseDto joinMeetingRoom(Long roomId, User user) {
        // 방 존재 여부 확인
        MeetingRoom room = meetingRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        
        // 내가 속한 레포의 방인지 확인
        Long repoId = room.getPullRequest().getRepo().getId();
        boolean isMember = repoRepository.existsByUserIdAndRepoId(user.getId(), repoId);
        if (!isMember) {
            throw new AccessDeniedException("User does not belong to this repository");
        }

        // Redis에서 세션 ID 가져오기
        String key = SESSION_KEY_PREFIX + roomId;
        String sessionId = (String) redisTemplate.opsForValue().get(key);

        // 세션 없거나 OpenVidu에 존재하지 않으면 새로 생성
        if (sessionId == null || !openViduService.isSessionActive(sessionId)) {
            sessionId = openViduService.createSession();
            redisTemplate.opsForValue().set(key, sessionId, sessionTtlHours, TimeUnit.HOURS); // TTL 2시간
        }

        // OpenVidu 토큰 발급
        String token = openViduService.generateToken(sessionId);

        return new JoinMeetingRoomResponseDto(roomId, token);
    }
}