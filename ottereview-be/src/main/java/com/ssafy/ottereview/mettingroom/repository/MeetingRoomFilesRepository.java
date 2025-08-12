package com.ssafy.ottereview.mettingroom.repository;

import com.ssafy.ottereview.mettingroom.entity.MeetingRoom;
import com.ssafy.ottereview.mettingroom.entity.MeetingRoomFiles;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MeetingRoomFilesRepository extends JpaRepository<MeetingRoomFiles, Long> {
    List<MeetingRoomFiles> findAllByMeetingRoom(MeetingRoom meetingRoom);
}
