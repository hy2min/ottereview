package com.ssafy.ottereview.review.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.githubapp.util.GithubAppUtil;
import com.ssafy.ottereview.review.dto.GithubReviewResponse;
import com.ssafy.ottereview.review.entity.ReviewState;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentCreateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
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

    private static final String REVIEW_TEMPLATE = """
            ### ✏️ **Reviewer: @%s**
            **리뷰 내용:**
            > %s
            """;
    private static final String COMMENT_TEMPLATE = """
            **👀 Reviewer: @%s**
            %s
            """;
    private final GithubAppUtil githubAppUtil;

    @Override
    public GithubReviewResponse createReviewOnGithub(Long installationId, String repoFullName, int githubPrNumber, String body, ReviewState state, List<ReviewCommentCreateRequest.CommentItem> reviewComments, String githubUsername) {
        try {
            // API URL 구성
            String url = String.format("https://api.github.com/repos/%s/pulls/%d/reviews", repoFullName, githubPrNumber);

            String formattedBody = REVIEW_TEMPLATE.formatted(githubUsername, body);

            List<Map<String, Object>> formattedComments = (reviewComments == null || reviewComments.isEmpty())
                    ? List.of()
                    : reviewComments.stream()
                    .map(c -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("path", c.getPath());

                        // 멀티 라인 코멘트인 경우 start_line/start_side 추가
                        if (c.getStartLine() != null) {
                            map.put("start_line", c.getStartLine());
                            if (c.getStartSide() != null) {
                                map.put("start_side", c.getStartSide());
                            }
                        }

                        // 단일 라인 or 멀티 라인 공통으로 line/side 설정
                        map.put("line", c.getLine());
                        if (c.getSide() != null) {
                            map.put("side", c.getSide());
                        }

                        map.put("body", COMMENT_TEMPLATE.formatted(githubUsername, c.getBody()));
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
            Map<Long, String> commentDiffs = new HashMap<>();
            Map<Long, Integer> commentPositions = new HashMap<>();
            Map<String, Long> bodyToGithubCommentId = new HashMap<>();

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
                            String commentBody = commentNode.get("body").asText();
                            Long commentId = commentNode.get("id").asLong();
                            bodyToGithubCommentId.put(commentBody, commentId);
                            commentIds.add(commentId);

                            String diffHunk = commentNode.has("diff_hunk") ? commentNode.get("diff_hunk").asText() : null;
                            commentDiffs.put(commentId, diffHunk);

                            Integer position = commentNode.has("position") && !commentNode.get("position").isNull() ? commentNode.get("position").asInt() : null;
                            commentPositions.put(commentId, position);
                        }
                    }

                }
            }
            log.info("GitHub Review Created: reviewId={}, commentIds={}", reviewId, commentIds);
            return new GithubReviewResponse(reviewId, commentIds, commentDiffs, commentPositions, bodyToGithubCommentId);
        } catch (Exception e) {
            throw new RuntimeException("GitHub 리뷰 생성 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public void updateReviewCommentOnGithub(Long installationId, String repoFullName, Long githubId, String newBody, String githubUsername) {
        try {
            String url = String.format(
                    "https://api.github.com/repos/%s/pulls/comments/%d",
                    repoFullName, githubId
            );

            String formattedBody = COMMENT_TEMPLATE.formatted(githubUsername, newBody);

            // 요청 바디
            Map<String, Object> requestBody = Map.of("body", formattedBody);

            // 헤더
            String token = githubAppUtil.getInstallationToken(installationId);
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            // PATCH 요청 전송
            RestTemplate restTemplate = new RestTemplate();
            restTemplate.setRequestFactory(new HttpComponentsClientHttpRequestFactory());
            restTemplate.exchange(url, HttpMethod.PATCH, entity, String.class);

            log.info("GitHub Review Comment Updated: commentId={}", githubId);

        } catch (HttpStatusCodeException e) {
            log.error("PATCH failed: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("GitHub 리뷰 코멘트 수정 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteReviewCommentOnGithub(Long installationId, String repoFullName, Long commentId) {
        try {
            String url = String.format(
                    "https://api.github.com/repos/%s/pulls/comments/%d",
                    repoFullName, commentId
            );

            String token = githubAppUtil.getInstallationToken(installationId);
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);

            RestTemplate restTemplate = new RestTemplate();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            restTemplate.exchange(url, HttpMethod.DELETE, entity, String.class);

            log.info("GitHub Review Comment Deleted: commentId={}", commentId);

        } catch (HttpStatusCodeException e) {
            log.error("DELETE Review Comment failed: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("GitHub 리뷰 코멘트 삭제 실패: " + e.getMessage(), e);
        }
    }


}
