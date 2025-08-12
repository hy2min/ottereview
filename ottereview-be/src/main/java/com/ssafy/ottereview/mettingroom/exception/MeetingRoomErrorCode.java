package com.ssafy.ottereview.mettingroom.exception;

import com.ssafy.ottereview.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MeetingRoomErrorCode implements ErrorCode {
    
    MEETING_ROOM_NOT_FOUND("MT001", "회의실을 찾을 수 없습니다", 404),
    MEETING_ROOM_ALREADY_EXISTS("MT002", "이미 존재하는 회의실입니다", 409),
    MEETING_ROOM_CREATION_FAILED("MT003", "회의실 생성에 실패했습니다", 500),
    MEETING_ROOM_UPDATE_FAILED("MT004", "회의실 업데이트에 실패했습니다", 500),
    MEETING_ROOM_DELETION_FAILED("MT005", "회의실 삭제에 실패했습니다", 500),
    MEETING_ROOM_PARTICIPANT_NOT_FOUND("MT006", "회의실 참여자를 찾을 수 없습니다", 404),
    MEETING_ROOM_PARTICIPANT_ALREADY_EXISTS("MT007", "이미 존재하는 회의실 참여자입니다", 409),
    MEETING_ROOM_PARTICIPANT_CREATION_FAILED("MT008", "회의실 참여자 생성에 실패했습니다", 500),
    MEETING_ROOM_PARTICIPANT_UPDATE_FAILED("MT009", "회의실 참여자 업데이트에 실패했습니다", 500),
    MEETING_ROOM_PARTICIPANT_DELETION_FAILED("MT010", "회의실 참여자 삭제에 실패했습니다", 500),
    MEETING_ROOM_AUTHORIZATION_FAILED("MT011", "회의실에 대한 권한이 없습니다", 403);
    
    private final String code;
    private final String message;
    private final int httpStatus;
}
