package com.ssafy.ottereview.description.repository;

import com.ssafy.ottereview.description.entity.Description;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DescriptionRepository extends JpaRepository<Description, Long> {

    List<Description> findAllByPullRequest(PullRequest pullRequest);
}
