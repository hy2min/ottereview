package com.ssafy.ottereview.priority.repository;

import com.ssafy.ottereview.priority.entity.Priority;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PriorityRepository extends JpaRepository<Priority, Long> {

    List<Priority> findAllByPullRequest(PullRequest pullRequest);



}
