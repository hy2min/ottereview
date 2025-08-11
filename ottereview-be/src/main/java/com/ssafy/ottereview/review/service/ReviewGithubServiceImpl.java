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
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public GithubReviewResponse createReviewOnGithub(
            Long installationId,
            String repoFullName,
            int githubPrNumber,
            String body,
            ReviewState state,
            List<ReviewCommentCreateRequest.CommentItem> reviewComments,
            String githubUsername
    ) {
        try {
            String token = githubAppUtil.getInstallationToken(installationId);
            HttpHeaders headers = createAuthHeaders(token);

            // GitHub Review 생성 요청
            String reviewUrl = String.format("https://api.github.com/repos/%s/pulls/%d/reviews", repoFullName, githubPrNumber);
            Map<String, Object> requestBody = createReviewRequestBody(body, state, reviewComments, githubUsername);
            Long reviewId = postReview(reviewUrl, requestBody, headers);

            // 해당 리뷰 코멘트들 조회
            List<JsonNode> reviewCommentNodes = fetchReviewComments(repoFullName, githubPrNumber, headers);
            return parseGithubReviewResponse(reviewId, reviewCommentNodes);

        } catch (Exception e) {
            throw new RuntimeException("GitHub 리뷰 생성 실패: " + e.getMessage(), e);
        }
    }


    @Override
    public void updateReviewCommentOnGithub(Long installationId, String repoFullName, Long githubId, String newBody, String githubUsername) {
        try {
            String token = githubAppUtil.getInstallationToken(installationId);
            HttpHeaders headers = createAuthHeaders(token);
            String url = String.format("https://api.github.com/repos/%s/pulls/comments/%d", repoFullName, githubId);

            Map<String, Object> requestBody = Map.of("body", COMMENT_TEMPLATE.formatted(githubUsername, newBody));
            RestTemplate restTemplate = createPatchRestTemplate();
            restTemplate.exchange(url, HttpMethod.PATCH, new HttpEntity<>(requestBody, headers), String.class);

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
            HttpHeaders headers = createAuthHeaders(token);

            RestTemplate restTemplate = new RestTemplate();
            restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), String.class);

            log.info("GitHub Review Comment Deleted: commentId={}", commentId);

        } catch (HttpStatusCodeException e) {
            log.error("DELETE Review Comment failed: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("GitHub 리뷰 코멘트 삭제 실패: " + e.getMessage(), e);
        }
    }

    private HttpHeaders createAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private Map<String, Object> createReviewRequestBody(String body, ReviewState state,
                                                        List<ReviewCommentCreateRequest.CommentItem> reviewComments,
                                                        String githubUsername) {
        Map<String, Object> requestBody = new HashMap<>();

        if (body != null && !body.isBlank()) {
            String formattedBody = REVIEW_TEMPLATE.formatted(githubUsername, body);
            requestBody.put("body", formattedBody);
        }

        requestBody.put("event", state.name());
        requestBody.put("comments", formatCommentItems(reviewComments, githubUsername));

        return requestBody;
    }

    private List<Map<String, Object>> formatCommentItems(List<ReviewCommentCreateRequest.CommentItem> commentItems, String githubUsername) {
        if (commentItems == null || commentItems.isEmpty()) {
            return List.of();
        }
        return commentItems.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("path", c.getPath());
            if (c.getStartLine() != null) {
                map.put("start_line", c.getStartLine());
                if (c.getStartSide() != null) map.put("start_side", c.getStartSide());
            }
            map.put("line", c.getLine());
            if (c.getSide() != null) map.put("side", c.getSide());
            map.put("body", COMMENT_TEMPLATE.formatted(githubUsername, c.getBody()));
            return map;
        }).toList();
    }

    private Long postReview(String url, Map<String, Object> requestBody, HttpHeaders headers) throws Exception {
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response = restTemplate.postForEntity(url, new HttpEntity<>(requestBody, headers), String.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            return jsonNode.get("id").asLong();
        }
        return null;
    }

    private List<JsonNode> fetchReviewComments(String repoFullName, int githubPrNumber, HttpHeaders headers) throws Exception {
        String commentsUrl = String.format("https://api.github.com/repos/%s/pulls/%d/comments", repoFullName, githubPrNumber);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> commentsResponse = restTemplate.exchange(commentsUrl, HttpMethod.GET, new HttpEntity<>(headers), String.class);

        if (commentsResponse.getStatusCode().is2xxSuccessful() && commentsResponse.getBody() != null) {
            JsonNode commentsArray = objectMapper.readTree(commentsResponse.getBody());
            List<JsonNode> list = new ArrayList<>();
            commentsArray.forEach(list::add);
            return list;
        }
        return List.of();
    }

    private GithubReviewResponse parseGithubReviewResponse(Long reviewId, List<JsonNode> comments) {
        List<Long> commentIds = new ArrayList<>();
        Map<Long, String> commentDiffs = new HashMap<>();
        Map<Long, Integer> commentPositions = new HashMap<>();
        Map<String, Long> bodyToGithubCommentId = new HashMap<>();

        for (JsonNode commentNode : comments) {
            if (commentNode.get("pull_request_review_id").asLong() == reviewId) {
                Long commentId = commentNode.get("id").asLong();
                String commentBody = commentNode.get("body").asText();
                bodyToGithubCommentId.put(commentBody, commentId);
                commentIds.add(commentId);

                String diffHunk = commentNode.has("diff_hunk") ? commentNode.get("diff_hunk").asText() : null;
                commentDiffs.put(commentId, diffHunk);

                Integer position = commentNode.has("position") && !commentNode.get("position").isNull() ? commentNode.get("position").asInt() : null;
                commentPositions.put(commentId, position);
            }
        }
        log.info("GitHub Review Created: reviewId={}, commentIds={}", reviewId, commentIds);
        return new GithubReviewResponse(reviewId, commentIds, commentDiffs, commentPositions, bodyToGithubCommentId);
    }

    private RestTemplate createPatchRestTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setRequestFactory(new HttpComponentsClientHttpRequestFactory());
        return restTemplate;
    }


}
