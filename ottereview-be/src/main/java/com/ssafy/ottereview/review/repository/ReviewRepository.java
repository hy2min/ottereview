package com.ssafy.ottereview.review.repository;

import com.ssafy.ottereview.review.entity.Review;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findById(long reviewId);

    @Query("SELECT r FROM Review r WHERE r.pullRequest.id = :pullRequestId")
    List<Review> findByPullRequestId(@Param("pullRequestId") Long pullRequestId);

    @Query("SELECT r FROM Review r WHERE r.pullRequest.id = :pullRequestId AND r.user.id = :userId")
    Optional<Review> findByPullRequestIdAndUserId(@Param("pullRequestId") Long pullRequestId,
            @Param("userId") Long userId);

    @Query("SELECT r FROM Review r LEFT JOIN FETCH r.reviewComments WHERE r.id = :reviewId")
    Optional<Review> findByIdWithComments(@Param("reviewId") Long reviewId);

    Optional<Review> findByGithubId(Long githubId);
}
