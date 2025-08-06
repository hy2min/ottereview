package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.review.entity.Review;
import com.ssafy.ottereview.review.repository.ReviewRepository;
import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
import com.ssafy.ottereview.reviewcomment.repository.ReviewCommentRepository;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import com.ssafy.ottereview.webhook.dto.ReviewCommentEventDto;
import com.ssafy.ottereview.webhook.dto.ReviewCommentEventDto.ReviewCommentInfo;
import com.ssafy.ottereview.webhook.dto.UserWebhookInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class ReviewCommentEventService {

    private final ObjectMapper objectMapper;
    private final ReviewCommentRepository reviewCommentRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final UserEventService userEventService;

    public void processReviewCommentEvent(String payload) {
        try {
            ReviewCommentEventDto event = objectMapper.readValue(payload, ReviewCommentEventDto.class);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(event);
            log.debug("DTO로 받은 ReviewCommentEventDto event: {}", formattedPayload);

            switch (event.getAction()) {

                case "created":
                    log.debug("리뷰 코멘트가 생성될 경우 발생하는 callback");
                    handleReviewCommentCreated(event);
                    break;

                case "edited":
                    log.debug("edit 이벤트: 리뷰 코멘트가 생성 및 수정될 경우 발생하는 callback");
                    break;

                case "deleted":
                    log.debug("리뷰 코멘트가 삭제될 경우 발생하는 callback");
                    handleReviewCommentDeleted(event);
                    break;

                default:
                    log.warn("Unhandled action: {}", event.getAction());
            }
        } catch (Exception e) {
            log.error("Error processing installation event", e);
        }
    }
    
    private void handleReviewCommentDeleted(ReviewCommentEventDto event) {
        Long reviewCommentGithubId = event.getComment()
                .getId();
        
        reviewCommentRepository.deleteByGithubId(reviewCommentGithubId);
    }
    
    private void handleReviewCommentCreated(ReviewCommentEventDto event) {
        // 리뷰 코멘트 생성 로직 구현
        log.debug("리뷰 코멘트 생성 로직 구현");

        Long reviewCommentGithubId = event.getComment()
                .getId();

        reviewCommentRepository.findByGithubId(reviewCommentGithubId)
                .ifPresentOrElse(
                        existingReviewComment -> updateReviewComment(event, existingReviewComment),
                        () -> registerReviewComment(event)
                );

    }

    private void updateReviewComment(ReviewCommentEventDto event, ReviewComment reviewComment) {
        log.debug("업데이트 리뷰 호출");
        ReviewCommentInfo comment = event.getComment();

        reviewComment.updateBodyAndTime(comment.getBody(), comment.getCreatedAt(), comment.getUpdatedAt());
    }

    private void registerReviewComment(ReviewCommentEventDto event) {
        log.debug("리뷰 코멘트 생성 호출");

        Review targetReview = reviewRepository.findByGithubId(event.getComment()
                        .getPullRequestReviewId())
                .orElseThrow(() -> new RuntimeException("리뷰를 찾을 수 없습니다"));

        ReviewCommentInfo comment = event.getComment();
        UserWebhookInfo user = event.getComment()
                .getUser();

        // 유저 조회 하고 없으면 생성
        User author = userRepository.findByGithubId(user.getId()).orElseGet(() -> userEventService.registerUser(user));

        ReviewComment newReviewComment = ReviewComment.builder()
                .githubId(comment.getId())
                .user(author)
                .review(targetReview)
                .path(comment.getPath())
                .body(comment.getBody())
                .startLine(comment.getStartLine())
                .startSide(comment.getStartSide())
                .line(comment.getLine())
                .side(comment.getSide())
                .position(comment.getPosition())
                .diffHunk(comment.getDiffHunk())
                .githubCreatedAt(comment.getCreatedAt())
                .githubUpdatedAt(comment.getUpdatedAt())
                .build();

        // 4. ReviewComment 저장
        reviewCommentRepository.save(newReviewComment);
    }
}
