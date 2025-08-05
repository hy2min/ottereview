package com.ssafy.ottereview.review.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.githubapp.util.GithubAppUtil;
import com.ssafy.ottereview.review.dto.GithubReviewResult;
import com.ssafy.ottereview.review.entity.ReviewState;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentCreateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewGithubServiceImpl implements ReviewGithubService {

    private final GithubAppUtil githubAppUtil;

    @Override
    public GithubReviewResult createReviewOnGithub(Long installationId, String repoFullName, int githubPrNumber, String body, ReviewState state, List<ReviewCommentCreateRequest.CommentItem> reviewComments, String githubUsername) {
        try {
            // API URL 구성
            String url = String.format("https://api.github.com/repos/%s/pulls/%d/reviews", repoFullName, githubPrNumber);

            // 템플릿 포맷팅 (리뷰 본문 & 코멘트)
            String reviewTemplate = """
                    ### ✏️ **Reviewer: @%s**
                    **리뷰 내용:**
                    > %s
                    """;

            String commentTemplate = """
                    **👀 Reviewer: @%s**
                    %s
                    """;

            String formattedBody = reviewTemplate.formatted(githubUsername, body);

            List<Map<String, Object>> formattedComments = (reviewComments == null || reviewComments.isEmpty())
                    ? List.of()
                    : reviewComments.stream()
                    .map(c -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("path", c.getPath());
                        map.put("position", c.getPosition());
                        map.put("body", commentTemplate.formatted(githubUsername, c.getBody()));
                        return map;
                    })
                    .collect(Collectors.toList());

            // 요청 바디
            Map<String, Object> requestBody = Map.of(
                    "body", formattedBody,
                    "event", state.name(),
                    "comments", formattedComments
            );

            // 헤더
            String token = githubAppUtil.getInstallationToken(installationId);
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            // 요청 전송
            RestTemplate restTemplate = new RestTemplate();
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            Long reviewId = null;
            List<Long> commentIds = new ArrayList<>();

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                reviewId = jsonNode.get("id").asLong();

                String commentsUrl = String.format(
                        "https://api.github.com/repos/%s/pulls/%d/comments",
                        repoFullName, githubPrNumber
                );

                ResponseEntity<String> commentsResponse = restTemplate.exchange(
                        commentsUrl, HttpMethod.GET, new HttpEntity<>(headers), String.class
                );

                if (commentsResponse.getStatusCode().is2xxSuccessful() && commentsResponse.getBody() != null) {
                    JsonNode commentsArray = new ObjectMapper().readTree(commentsResponse.getBody());
                    for (JsonNode commentNode : commentsArray) {
                        if (commentNode.get("pull_request_review_id").asLong() == reviewId) {
                            commentIds.add(commentNode.get("id").asLong());
                        }
                    }

                }
            }

            log.info("GitHub Review Created: reviewId={}, commentIds={}",
                    reviewId, commentIds);

            return new GithubReviewResult(reviewId, commentIds);
        } catch (Exception e) {
            throw new RuntimeException("GitHub 리뷰 생성 실패: " + e.getMessage(), e);
        }
    }
}
