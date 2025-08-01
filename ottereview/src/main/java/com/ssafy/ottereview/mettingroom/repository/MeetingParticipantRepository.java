package com.ssafy.ottereview.mettingroom.repository;

import com.ssafy.ottereview.mettingroom.entity.MeetingParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, Long> {

    List<MeetingParticipant> findByMeetingRoomId(Long roomId);

    boolean existsByMeetingRoomIdAndUserId(Long roomId, Long id);

    @Query("""
                SELECT mp
                FROM MeetingParticipant mp
                JOIN FETCH mp.meetingRoom mr
                WHERE mp.user.id = :userId AND mr.createdAt >= :cutoff
            """)
    List<MeetingParticipant> findActiveMeetingRoomsByUserId(
            @Param("userId") Long userId,
            @Param("cutoff") LocalDateTime cutoff
    );

}
