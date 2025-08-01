package com.ssafy.ottereview.reviewcomment.repository;

import com.ssafy.ottereview.review.entity.Review;
import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewCommentRepository extends JpaRepository<ReviewComment, Long> {

    List<ReviewComment> findAllByReview(Review review);

    List<ReviewComment> findAllByUserId(Long userId);

    List<ReviewComment> findAllByReviewAndPath(Review review, String path);
}
