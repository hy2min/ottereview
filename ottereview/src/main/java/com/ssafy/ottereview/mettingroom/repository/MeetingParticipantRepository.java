package com.ssafy.ottereview.mettingroom.repository;

import com.ssafy.ottereview.mettingroom.entity.MeetingParticipant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, Long> {

    List<MeetingParticipant> findByMeetingRoomId(Long roomId);

    boolean existsByMeetingRoomIdAndUserId(Long roomId, Long id);

    @Query("""
                SELECT mp
                FROM MeetingParticipant mp
                JOIN FETCH mp.meetingRoom
                WHERE mp.user.id = :userId
            """)
    List<MeetingParticipant> findMeetingRoomsByUserId(@Param("userId") Long userId);

}
