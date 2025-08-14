package com.ssafy.ottereview.priority.repository;

import com.ssafy.ottereview.priority.entity.Priority;
import com.ssafy.ottereview.priority.entity.PriorityFile;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PriorityFileRepository extends JpaRepository<PriorityFile, Long> {

    List<PriorityFile> findAllByPriority(Priority priority);
}
