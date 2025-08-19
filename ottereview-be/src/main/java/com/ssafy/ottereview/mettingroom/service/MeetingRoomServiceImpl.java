package com.ssafy.ottereview.mettingroom.service;

import com.ssafy.ottereview.account.entity.UserAccount;
import com.ssafy.ottereview.account.repository.UserAccountRepository;
import com.ssafy.ottereview.common.config.yjs.handler.YjsWebSocketHandler;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.email.dto.EmailRequestDto;
import com.ssafy.ottereview.email.service.EmailService;
import com.ssafy.ottereview.mettingroom.dto.*;
import com.ssafy.ottereview.mettingroom.entity.MeetingParticipant;
import com.ssafy.ottereview.mettingroom.entity.MeetingRoom;
import com.ssafy.ottereview.mettingroom.entity.MeetingRoomFiles;
import com.ssafy.ottereview.mettingroom.exception.MeetingRoomErrorCode;
import com.ssafy.ottereview.mettingroom.repository.MeetingParticipantRepository;
import com.ssafy.ottereview.mettingroom.repository.MeetingRoomFilesRepository;
import com.ssafy.ottereview.mettingroom.repository.MeetingRoomRepository;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.exception.PullRequestErrorCode;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.user.entity.User;
import java.util.ArrayList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MeetingRoomServiceImpl implements MeetingRoomService {

    private static final String SESSION_KEY_PREFIX = "meeting:session:";
    private final YjsWebSocketHandler yjsWebSocketHandler;
    private final MeetingRoomRepository meetingRoomRepository;
    private final PullRequestRepository pullRequestRepository;
    private final UserAccountRepository userAccountRepository;
    private final MeetingParticipantRepository meetingParticipantRepository;
    private final OpenViduService openViduService;
    private final EmailService emailService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final MeetingRoomFilesRepository meetingRoomFilesRepository;

    @Value("${openvidu.session.ttl-hours}")
    private long sessionTtlHours;

    @Override
    @Transactional
    public MeetingRoomResponseDto createMeetingRoom(MeetingRoomRequestDto request, User user) {
        // Pull Request 조회
        PullRequest pullRequest = pullRequestRepository.findById(request.getPrId())
                .orElseThrow(() -> new BusinessException(PullRequestErrorCode.PR_NOT_FOUND));

        // MeetingRoom 생성
        MeetingRoom room = MeetingRoom.builder()
                .roomName(request.getRoomName())
                .pullRequest(pullRequest)
                .build();

        // 초대받은 사람 셋
        Set<Long> inviteeIds = request.getInviteeIds() != null
                ? new HashSet<>(request.getInviteeIds())
                : new HashSet<>();
        log.debug("초대받은 사람" + inviteeIds);

        // 레포 멤버 조회
        List<User> repoUsers = userAccountRepository.findAllByAccount(
                        pullRequest.getRepo().getAccount())
                .stream()
                .map(UserAccount::getUser)
                .distinct()
                .toList();

        // 전체 멤버 루프 돌면서 Participant 생성
        for (User repoUser : repoUsers) {
            boolean isOwner = repoUser.getId().equals(user.getId());
            boolean sendMail = !isOwner && inviteeIds.contains(repoUser.getId());

            MeetingParticipant participant = MeetingParticipant.builder()
                    .user(repoUser)
                    .isOwner(isOwner)
                    .sendMail(sendMail)
                    .build();

            room.addParticipant(participant);
        }


        // 3) 부모 먼저 save (ID 확보)
        meetingRoomRepository.save(room);
        List<MeetingRoomFiles> fileEntities = new ArrayList<>();
        // 4) 파일 저장은 '부모 save 이후'에
        if (request.getFiles() != null && !request.getFiles().isEmpty()) {
             fileEntities = request.getFiles().stream()
                    .map(fn -> MeetingRoomFiles.builder()
                            .fileName(fn)
                            .meetingRoom(room)   // 이제 영속/ID 있음
                            .build())
                    .toList();
            meetingRoomFilesRepository.saveAll(fileEntities);
        }

        // 이메일 보내는 로직
        room.getParticipants().stream()
                .filter(MeetingParticipant::isSendMail) // sendMail == true인 email이 존재하는 유저만 이메일 전송
                .filter(p -> p.getUser().getGithubEmail() != null && !p.getUser().getGithubEmail().isBlank())
                .forEach(participant -> {
                    EmailRequestDto.ChatInvite inviteDto = new EmailRequestDto.ChatInvite(
                            participant.getUser().getGithubEmail(),
                            room.getId(),
                            user.getGithubUsername(),
                            room.getRoomName()
                    );
                    emailService.sendChatInvite(inviteDto); // @Async 메서드 호출
                });

        // OpenVidu 세션 생성 & Redis 저장 (roomId를 customSessionId로 사용)
        String customSessionId = "room-" + room.getId();
        String sessionId = openViduService.createSession(customSessionId);
        redisTemplate.opsForValue()
                .set(SESSION_KEY_PREFIX + room.getId(), sessionId, sessionTtlHours, TimeUnit.HOURS);

        // DTO 변환
        List<MeetingParticipantDto> participantDtos = room.getParticipants().stream()
                .map(MeetingParticipantDto::fromEntity)
                .collect(Collectors.toList());

        List<MeetingRoomFilesDto> files = meetingRoomFilesRepository.findAllByMeetingRoom(room).stream().map(r -> {
            return new MeetingRoomFilesDto(r.getFileName());
        }).toList();

        return new MeetingRoomResponseDto(room.getId(), room.getRoomName(), user.getId(),
                participantDtos,files);
    }

    @Override
    @Transactional(readOnly = true)
    public MeetingRoomResponseDto getMeetingRoomDetail(Long roomId) {
        // Room 조회
        MeetingRoom room = meetingRoomRepository.findByIdWithParticipantsAndUsers(roomId)
                .orElseThrow(() -> new BusinessException(MeetingRoomErrorCode.MEETING_ROOM_NOT_FOUND));

        // 참여자 조회
        List<MeetingParticipantDto> participantDtos = room.getParticipants().stream()
                .map(MeetingParticipantDto::fromEntity)
                .toList();

        // conflictFiles 조회
        List<MeetingRoomFilesDto> files = meetingRoomFilesRepository.findAllByMeetingRoom(room).stream().map(r -> {

            return new MeetingRoomFilesDto(r.getFileName());
        }).toList();

        // Owner ID
        Long ownerId = room.getParticipants().stream()
                .filter(MeetingParticipant::isOwner)
                .map(p -> p.getUser().getId())
                .findFirst()
                .orElse(null);

        return new MeetingRoomResponseDto(room.getId(), room.getRoomName(), ownerId,
                participantDtos,files);
    }

    @Override
    @Transactional
    public void closeMeetingRoom(Long userId, Long roomId) {
        // Room 조회
        MeetingRoom room = meetingRoomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(MeetingRoomErrorCode.MEETING_ROOM_NOT_FOUND));

        // owner 조회
        Long ownerId = room.getParticipants().stream()
                .filter(MeetingParticipant::isOwner)
                .map(p -> p.getUser().getId())
                .findFirst()
                .orElse(null);

        if (!Objects.equals(ownerId, userId)) {
            throw new BusinessException(MeetingRoomErrorCode.MEETING_ROOM_AUTHORIZATION_FAILED);
        }
        // Redis 세션 삭제
        String key = SESSION_KEY_PREFIX + roomId;
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
                .orElseThrow(() -> new BusinessException(MeetingRoomErrorCode.MEETING_ROOM_NOT_FOUND));

        // 내가 속한 레포의 방인지 확인
        boolean isMember = meetingParticipantRepository.existsByMeetingRoomIdAndUserId(roomId,
                user.getId());
        if (!isMember) {
            throw new AccessDeniedException("User does not belong to this repository");
        }

        // Redis에서 세션 ID 가져오기
        String key = SESSION_KEY_PREFIX + roomId;
        String sessionId = (String) redisTemplate.opsForValue().get(key);

        // 세션 없거나 OpenVidu에 존재하지 않으면 에러 발생
        if (sessionId == null || !openViduService.isSessionActive(sessionId)) {
            throw new BusinessException(MeetingRoomErrorCode.MEETING_ROOM_NOT_FOUND, "회의방이 존재하지 않거나 세션이 활성화되어 있지 않습니다.");
        }
        // OpenVidu 토큰 발급
        String token = openViduService.generateToken(sessionId);

        return new JoinMeetingRoomResponseDto(roomId, room.getRoomName(), token);
    }

    // 30분 마다 회의방 지난거 확인하고 삭제하기
    @Scheduled(fixedRate = 1000*60*30) // 30분마다 실행
    @Transactional
    public void cleanExpiredMeetingRooms() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(sessionTtlHours);
        List<MeetingRoom> expiredRooms = meetingRoomRepository.findAllByCreatedAtBefore(cutoff);

        for (MeetingRoom room : expiredRooms) {
            meetingRoomRepository.delete(room);
            yjsWebSocketHandler.closeRoom(room.getId()); // 화이트보드 세션 종료
        }
    }

}
