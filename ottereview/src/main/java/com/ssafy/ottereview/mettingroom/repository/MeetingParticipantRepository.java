package com.ssafy.ottereview.mettingroom.repository;

import com.ssafy.ottereview.mettingroom.entity.MeetingParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, Long> {

    List<MeetingParticipant> findByMeetingRoomId(Long roomId);
}
