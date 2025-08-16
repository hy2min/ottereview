package com.ssafy.ottereview.reviewcomment.repository;

import com.ssafy.ottereview.review.entity.Review;
import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewCommentRepository extends JpaRepository<ReviewComment, Long> {

    @Query("SELECT rc FROM ReviewComment rc LEFT JOIN FETCH rc.parentComment WHERE rc.review = :review")
    List<ReviewComment> findAllByReview(@Param("review") Review review);
    
    List<ReviewComment> findAllByUserId(Long userId);

    Optional<ReviewComment> findByGithubId(Long githubId);

    List<ReviewComment> findAllByReviewAndPath(Review review, String path);
    
    void deleteByGithubId(Long githubId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ReviewComment rc SET rc.githubId = :githubId WHERE rc.id = :id")
    void updateGithubId(@Param("id") Long id, @Param("githubId") Long githubId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE ReviewComment c SET c.diffHunk = :diffHunk WHERE c.id = :id")
    void updateDiffHunk(@Param("id") Long id, @Param("diffHunk") String diffHunk);

    List<ReviewComment> findAllByReviewId(Long id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE ReviewComment c SET c.position = :position WHERE c.id = :id")
    void updatePosition(@Param("id") Long id, @Param("position") Integer position);

    List<ReviewComment> findByReviewId(Long reviewId);

    /**
     * 클로드 코드
     */

    List<ReviewComment> findAllByParentCommentIsNull();

    List<ReviewComment> findAllByParentComment(ReviewComment parentComment);

    List<ReviewComment> findAllByParentCommentId(Long parentCommentId);

    Optional<ReviewComment> findByGithubInReplyToId(Long githubInReplyToId);
}
