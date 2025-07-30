package com.ssafy.ottereview.mettingroom.dto;

import com.ssafy.ottereview.mettingroom.entity.MeetingParticipant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class MeetingParticipantDto {
    private Long id;
    private String username;
    private String profileImageUrl;
    private boolean isOwner;

    // 회원 정보 나열을 위한 메소드
    public static MeetingParticipantDto fromEntity(MeetingParticipant participant) {
        return new MeetingParticipantDto(
                participant.getUser().getId(),
                participant.getUser().getGithubUsername(),
                participant.getUser().getProfileImageUrl(),
                participant.isOwner()
        );
    }
}
