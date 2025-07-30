package com.ssafy.ottereview.mettingroom.repository;

import com.ssafy.ottereview.mettingroom.entity.MeetingRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MeetingRoomRepository extends JpaRepository<MeetingRoom, Long> {
    @Query("""
            SELECT DISTINCT r
            FROM MeetingRoom r
            LEFT JOIN FETCH r.participants p
            LEFT JOIN FETCH p.user
            WHERE r.id = :roomId
            """)
    Optional<MeetingRoom> findByIdWithParticipantsAndUsers(@Param("roomId") Long roomId);
}
