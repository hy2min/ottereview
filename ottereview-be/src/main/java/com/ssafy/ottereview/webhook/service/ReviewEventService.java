package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.review.entity.Review;
import com.ssafy.ottereview.review.entity.ReviewState;
import com.ssafy.ottereview.review.repository.ReviewRepository;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import com.ssafy.ottereview.webhook.dto.ReviewEventDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class ReviewEventService {
    
    private final PullRequestRepository pullRequestRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final ReviewRepository reviewRepository;
    
    public void processReviewEvent(String payload) {
        try {
            ReviewEventDto event = objectMapper.readValue(payload, ReviewEventDto.class);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(event);
            log.debug("DTO로 받은 ReviewEventDto event: {}", formattedPayload);
            
            switch (event.getAction()) {
                case "edited":
                    log.debug("이미 제출된 리뷰의 내용을 수정할 때 callback");
                    break;
                
                case "submitted":
                    log.debug("리뷰어가 처음으로 리뷰를 제출할 때 발생하는 callback");
                    handleReviewSubmitted(event);
                    break;
                
                default:
                    log.warn("Unhandled action: {}", event.getAction());
            }
        } catch (Exception e) {
            log.error("Error processing installation event", e);
        }
    }
    
    private void handleReviewSubmitted(ReviewEventDto event) {
        try {
            // 1. PullRequest 조회 또는 생성
            PullRequest pullRequest = pullRequestRepository.findByGithubId(event.getPullRequest()
                            .getId())
                    .orElseThrow(
                            () -> new RuntimeException("PullRequest not found for ID: " + event.getPullRequest()
                                    .getId()));
            
            // 2. User 조회 또는 생성
            User reviewer = userRepository.findByGithubId(event.getReview()
                            .getUser()
                            .getId())
                    .orElseThrow(() -> new RuntimeException("Reviewer not found for ID: " + event.getReview()
                            .getUser()
                            .getId()));
            
            // 3. Review 생성
            Review review = Review.builder()
                    .pullRequest(pullRequest)
                    .user(reviewer)
                    .body(event.getReview()
                            .getBody())
                    .commitSha(event.getReview()
                            .getCommitId())
                    .state(ReviewState.fromValue(event.getReview()
                            .getState()))
                    .githubCreatedAt(event.getReview()
                            .getSubmittedAt())
                    .build();
            
            // 4. Review 저장
            reviewRepository.save(review);
            
        } catch (Exception e) {
            log.error("Error handling review submitted event", e);
            throw e;
        }
    }
}
