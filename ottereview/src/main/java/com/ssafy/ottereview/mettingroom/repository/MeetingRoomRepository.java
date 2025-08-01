package com.ssafy.ottereview.mettingroom.repository;

import com.ssafy.ottereview.mettingroom.entity.MeetingRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingRoomRepository extends JpaRepository<MeetingRoom, Long> {
    @Query("""
            SELECT DISTINCT m
            FROM MeetingRoom m
            LEFT JOIN FETCH m.participants p
            LEFT JOIN FETCH p.user
            WHERE m.id = :roomId
            """)
    Optional<MeetingRoom> findByIdWithParticipantsAndUsers(@Param("roomId") Long roomId);

    @Query("SELECT r FROM MeetingRoom r WHERE r.createdAt >= :cutoff")
    List<MeetingRoom> findActiveRooms(@Param("cutoff") LocalDateTime cutoff);

    void deleteAllByCreatedAtBefore(LocalDateTime cutoff);
}
