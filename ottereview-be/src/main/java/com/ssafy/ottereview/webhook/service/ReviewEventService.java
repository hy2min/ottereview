package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.review.entity.Review;
import com.ssafy.ottereview.review.entity.ReviewState;
import com.ssafy.ottereview.review.repository.ReviewRepository;
import com.ssafy.ottereview.reviewer.entity.Reviewer;
import com.ssafy.ottereview.reviewer.repository.ReviewerRepository;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import com.ssafy.ottereview.webhook.dto.ReviewEventDto;
import com.ssafy.ottereview.webhook.exception.WebhookErrorCode;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.parameters.P;
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
    private final UserEventService userEventService;
    private final ReviewerRepository reviewerRepository;
    private static final Pattern REVIEW_PATTERN = Pattern.compile(">\\s*(.+)");

    public void processReviewEvent(String payload) {
        
        try {
            
            ReviewEventDto event = objectMapper.readValue(payload, ReviewEventDto.class);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(event);
            log.debug("DTO로 받은 ReviewEventDto event: {}", formattedPayload);
            
            switch (event.getAction()) {
                case "edited":
                    log.debug("이미 제출된 리뷰의 내용을 수정할 때 callback");
                    handleReviewSubmittedAndEdited(event);
                    break;
                
                case "submitted":
                    log.debug("리뷰어가 처음으로 리뷰를 제출할 때 발생하는 callback");
                    handleReviewSubmittedAndEdited(event);
                    break;
                
                default:
                    log.warn("Unhandled action: {}", event.getAction());
            }
        } catch (Exception e) {
            throw new BusinessException(WebhookErrorCode.WEBHOOK_UNSUPPORTED_ACTION);
        }
    }
    
    private void handleReviewSubmittedAndEdited(ReviewEventDto event) {
        Long reviewGithubId = event.getReview()
                .getId();
        try {
            reviewRepository.findByGithubId(reviewGithubId)
                    .ifPresentOrElse(
                            existingReview -> updateReview(event, existingReview),
                            () -> registerReview(event)
                    );
        } catch (DataIntegrityViolationException e) {
            // 유니크 제약 위반 시 업데이트로 전환
            log.warn("중복 리뷰 생성 시도 감지, 업데이트로 전환: githubId={}", reviewGithubId);
            
            Review existingReview = reviewRepository.findByGithubId(reviewGithubId)
                    .orElseThrow(() -> new RuntimeException("리뷰를 찾을 수 없습니다"));
            updateReview(event, existingReview);
        }
    }

    public static String extractReviewContent(String comment) {
        if (comment == null || comment.trim().isEmpty()) {
            return null;
        }

        Matcher matcher = REVIEW_PATTERN.matcher(comment);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }

        return null;
    }

    private void updateReview(ReviewEventDto event, Review review) {

        event.getReview().changeBody(extractReviewContent(event.getReview().getBody()));

        log.info(event.getReview().getBody());

        review.updateBodyAndCreateAt(event.getReview()
                .getBody(), event.getReview()
                .getSubmittedAt());
    }
    
    private void registerReview(ReviewEventDto event) {
        // 1. PullRequest 조회 또는 생성
        PullRequest pullRequest = pullRequestRepository.findByGithubId(event.getPullRequest()
                        .getId())
                .orElseThrow(
                        () -> new RuntimeException("PullRequest not found for ID: " + event.getPullRequest()
                                .getId()));
        
        // 2. User 조회 또는 생성
        User author = userRepository.findByGithubId(event.getReview()
                        .getUser()
                        .getId())
                .orElseGet(() -> userEventService.registerUser(event.getReview()
                        .getUser()));
        event.getReview().changeBody(extractReviewContent(event.getReview().getBody()));

        log.info(event.getReview().getBody());
        // 3. Review 생성
        Review review = Review.builder()
                .githubId(event.getReview()
                        .getId())
                .pullRequest(pullRequest)
                .user(author)
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
        
        // 5. 작성자가 reviewer인 경우 approveCnt 증가
        if(reviewerRepository.existsByPullRequestAndUser(pullRequest, author)){
            pullRequest.addApproveCnt();
        }
    }
}
