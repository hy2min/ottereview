package com.ssafy.ottereview.reviewer.repository;

import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.reviewer.entity.Reviewer;
import com.ssafy.ottereview.user.entity.User;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewerRepository extends JpaRepository<Reviewer, Long> {

    // 해당 PR의 모든 reviewer 조회시 사용
    List<Reviewer> findAllByPullRequest(PullRequest pullRequest);

    List<Reviewer> findAllByUser(User user);
    
    boolean existsByPullRequestAndUser(PullRequest pullRequest, User user);

    Optional<Reviewer> findByPullRequestAndUser(PullRequest pullRequest, User user);

    List<Reviewer> findByPullRequest(PullRequest pullRequest);
}
