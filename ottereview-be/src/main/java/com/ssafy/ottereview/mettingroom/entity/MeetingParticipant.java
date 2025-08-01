package com.ssafy.ottereview.mettingroom.entity;

import com.ssafy.ottereview.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "meeting_participant")
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class MeetingParticipant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private MeetingRoom meetingRoom;

    @Column(nullable = false)
    private boolean isOwner;

    @Column(nullable = false)
    private boolean sendMail;

    void assignMeetingRoom(MeetingRoom meetingRoom) {
        this.meetingRoom = meetingRoom;
    }
}
