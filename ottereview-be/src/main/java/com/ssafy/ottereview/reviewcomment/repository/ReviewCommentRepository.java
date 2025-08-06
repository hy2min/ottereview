package com.ssafy.ottereview.reviewcomment.repository;

import com.ssafy.ottereview.review.entity.Review;
import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewCommentRepository extends JpaRepository<ReviewComment, Long> {

    List<ReviewComment> findAllByReview(Review review);

    List<ReviewComment> findAllByUserId(Long userId);

    List<ReviewComment> findAllByReviewAndPath(Review review, String path);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ReviewComment rc SET rc.githubId = :githubId WHERE rc.id = :id")
    void updateGithubId(@Param("id") Long id, @Param("githubId") Long githubId);
}
