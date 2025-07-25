package com.ssafy.ottereview.pullrequest.repository;

import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.repo.entity.Repo;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PullRequestRepository extends JpaRepository<PullRequest, Long> {

    List<PullRequest> findByRepo(Repo repo);

}
