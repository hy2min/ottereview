package com.ssafy.ottereview.description.repository;

import com.ssafy.ottereview.description.entity.Description;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DescriptionRepository extends JpaRepository<Description, Long> {

    List<Description> findByPullRequestId(Long pullRequestId);

}
