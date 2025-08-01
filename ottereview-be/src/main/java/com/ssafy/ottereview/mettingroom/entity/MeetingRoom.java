package com.ssafy.ottereview.mettingroom.entity;

import com.ssafy.ottereview.common.entity.BaseEntity;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "meeting_room")
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class MeetingRoom extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_name", nullable = false)
    private String roomName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pr_id", nullable = false)
    private PullRequest pullRequest;

    @OneToMany(mappedBy = "meetingRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MeetingParticipant> participants = new ArrayList<>();

    public void addParticipant(MeetingParticipant participant) {
        participants.add(participant);
        participant.assignMeetingRoom(this);
    }

}
