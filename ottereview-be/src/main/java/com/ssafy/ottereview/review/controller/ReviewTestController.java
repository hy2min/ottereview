package com.ssafy.ottereview.review.controller;

import com.ssafy.ottereview.account.repository.AccountRepository;
import com.ssafy.ottereview.githubapp.util.GithubAppUtil;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHPullRequest;
import org.kohsuke.github.GHPullRequestReview;
import org.kohsuke.github.GHPullRequestReviewComment;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GHUser;
import org.kohsuke.github.GitHub;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/{account-id}/{repo-id}/{pr-id}")
@RequiredArgsConstructor
@Slf4j
public class ReviewTestController {

    private final GithubAppUtil githubAppUtil;
    private final RepoRepository repoRepository;
    private final AccountRepository accountRepository;

    @GetMapping("/review-info")
    public ResponseEntity<Map<String, Object>> getReviewInfo(
            @PathVariable("pr-id") Long prId,
            @PathVariable("account-id") Long accountId,
            @PathVariable("repo-id") Long repoId,
            @AuthenticationPrincipal CustomUserDetail userDetail) {

        try {
            // getReferenceById 대신 findById 사용 (실제 데이터 조회)
            Long installationId = accountRepository.findById(accountId)
                    .orElseThrow(
                            () -> new RuntimeException("Account not found with id: " + accountId))
                    .getInstallationId();
            GitHub github = githubAppUtil.getGitHub(installationId);

            // 레포지토리 정보 가져오기 (findById 사용)
            String repoFullName = repoRepository.findById(repoId)
                    .orElseThrow(
                            () -> new RuntimeException("Repository not found with id: " + repoId))
                    .getFullName();
            GHRepository repository = github.getRepository(repoFullName);

            // PR 정보 가져오기
            GHPullRequest pullRequest = repository.getPullRequest(prId.intValue());

            Map<String, Object> result = new HashMap<>();

            // 1. PR 기본 정보
            result.put("prInfo", getPullRequestInfo(pullRequest));

            // 2. 리뷰 정보 가져오기
            result.put("reviews", getReviewsInfo(pullRequest));

            // 3. 리뷰 댓글 정보 가져오기
            result.put("reviewComments", getReviewCommentsInfo(pullRequest));

            // 4. 요청된 리뷰어 정보 가져오기
            result.put("requestedReviewers", getRequestedReviewersInfo(pullRequest));

            log.info("Successfully retrieved review info for PR #{} in repo {}", prId,
                    repoFullName);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Error retrieving review info for PR #{}", prId, e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error",
                            "Failed to retrieve review information: " + e.getMessage()));
        }
    }

    /**
     * PR 기본 정보 추출
     */
    private Map<String, Object> getPullRequestInfo(GHPullRequest pr) throws Exception {
        Map<String, Object> prInfo = new HashMap<>();
        prInfo.put("id", pr.getId());
        prInfo.put("number", pr.getNumber());
        prInfo.put("title", pr.getTitle());
        prInfo.put("body", pr.getBody());
        prInfo.put("state", pr.getState().toString());
        prInfo.put("createdAt", pr.getCreatedAt());
        prInfo.put("updatedAt", pr.getUpdatedAt());
        prInfo.put("author", pr.getUser().getLogin());
        prInfo.put("authorName", pr.getUser().getName());
        prInfo.put("headBranch", pr.getHead().getRef());
        prInfo.put("baseBranch", pr.getBase().getRef());
        prInfo.put("mergeable", pr.getMergeable());
        prInfo.put("merged", pr.isMerged());
        return prInfo;
    }

    /**
     * 리뷰 정보 가져오기
     */
    private List<Map<String, Object>> getReviewsInfo(GHPullRequest pr) throws Exception {
        List<Map<String, Object>> reviews = new ArrayList<>();

        for (GHPullRequestReview review : pr.listReviews()) {
            Map<String, Object> reviewInfo = new HashMap<>();
            reviewInfo.put("id", review.getId());
            reviewInfo.put("state", review.getState()
                    .toString()); // APPROVED, CHANGES_REQUESTED, COMMENTED, DISMISSED
            reviewInfo.put("body", review.getBody());
            reviewInfo.put("submittedAt", review.getSubmittedAt());
            reviewInfo.put("commitId", review.getCommitId());

            // 리뷰어 정보
            GHUser reviewer = review.getUser();
            Map<String, Object> reviewerInfo = new HashMap<>();
            reviewerInfo.put("login", reviewer.getLogin());
            reviewerInfo.put("name", reviewer.getName());
            reviewerInfo.put("avatarUrl", reviewer.getAvatarUrl());
            reviewerInfo.put("htmlUrl", reviewer.getHtmlUrl());
            reviewInfo.put("reviewer", reviewerInfo);

            reviews.add(reviewInfo);
        }

        return reviews;
    }

    /**
     * 리뷰 댓글 정보 가져오기
     */
    private List<Map<String, Object>> getReviewCommentsInfo(GHPullRequest pr) throws Exception {
        List<Map<String, Object>> comments = new ArrayList<>();

        for (GHPullRequestReviewComment comment : pr.listReviewComments()) {
            Map<String, Object> commentInfo = new HashMap<>();
            commentInfo.put("id", comment.getId());
            commentInfo.put("body", comment.getBody());
            commentInfo.put("path", comment.getPath()); // 파일 경로
            commentInfo.put("position", comment.getPosition()); // 파일 내 위치
            commentInfo.put("line", comment.getLine()); // 라인 번호
            commentInfo.put("side", comment.getSide()); // LEFT 또는 RIGHT
            commentInfo.put("startLine", comment.getStartLine());
            commentInfo.put("startSide", comment.getStartSide());
            commentInfo.put("createdAt", comment.getCreatedAt());
            commentInfo.put("updatedAt", comment.getUpdatedAt());
            commentInfo.put("commitId", comment.getCommitId());
            commentInfo.put("originalCommitId", comment.getOriginalCommitId());
            commentInfo.put("diffHunk", comment.getDiffHunk());
            commentInfo.put("pullRequestReviewId", comment.getPullRequestReviewId());

            // 댓글 작성자 정보
            GHUser commenter = comment.getUser();
            Map<String, Object> commenterInfo = new HashMap<>();
            commenterInfo.put("login", commenter.getLogin());
            commenterInfo.put("name", commenter.getName());
            commenterInfo.put("avatarUrl", commenter.getAvatarUrl());
            commenterInfo.put("htmlUrl", commenter.getHtmlUrl());
            commentInfo.put("commenter", commenterInfo);

            comments.add(commentInfo);
        }

        return comments;
    }

    /**
     * 요청된 리뷰어 정보 가져오기
     */
    private List<Map<String, Object>> getRequestedReviewersInfo(GHPullRequest pr) throws Exception {
        List<Map<String, Object>> requestedReviewers = new ArrayList<>();

        for (GHUser reviewer : pr.getRequestedReviewers()) {
            Map<String, Object> reviewerInfo = new HashMap<>();
            reviewerInfo.put("login", reviewer.getLogin());
            reviewerInfo.put("name", reviewer.getName());
            reviewerInfo.put("avatarUrl", reviewer.getAvatarUrl());
            reviewerInfo.put("htmlUrl", reviewer.getHtmlUrl());
            reviewerInfo.put("type", reviewer.getType());

            requestedReviewers.add(reviewerInfo);
        }

        return requestedReviewers;
    }

    /**
     * 특정 리뷰어의 리뷰 상태 확인
     */
    @GetMapping("/reviewer-status/{reviewerLogin}")
    public ResponseEntity<Map<String, Object>> getReviewerStatus(
            @PathVariable("pr-id") Long prId,
            @PathVariable("account-id") Long accountId,
            @PathVariable("repo-id") Long repoId,
            @PathVariable("reviewerLogin") String reviewerLogin,
            @AuthenticationPrincipal CustomUserDetail userDetail) {

        try {
            Long installationId = accountRepository.findById(accountId)
                    .orElseThrow(
                            () -> new RuntimeException("Account not found with id: " + accountId))
                    .getInstallationId();
            GitHub github = githubAppUtil.getGitHub(installationId);

            String repoFullName = repoRepository.findById(repoId)
                    .orElseThrow(
                            () -> new RuntimeException("Repository not found with id: " + repoId))
                    .getFullName();
            GHRepository repository = github.getRepository(repoFullName);
            GHPullRequest pullRequest = repository.getPullRequest(prId.intValue());

            Map<String, Object> result = new HashMap<>();
            result.put("reviewerLogin", reviewerLogin);
            result.put("hasReviewed", false);
            result.put("latestReviewState", null);
            result.put("reviewCount", 0);

            int reviewCount = 0;
            String latestState = null;

            // 해당 리뷰어의 모든 리뷰 확인
            for (GHPullRequestReview review : pullRequest.listReviews()) {
                if (review.getUser().getLogin().equals(reviewerLogin)) {
                    reviewCount++;
                    latestState = review.getState().toString();
                    result.put("hasReviewed", true);
                }
            }

            result.put("reviewCount", reviewCount);
            result.put("latestReviewState", latestState);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Error getting reviewer status for {}", reviewerLogin, e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to get reviewer status: " + e.getMessage()));
        }
    }

    /**
     * 아직 리뷰하지 않은 리뷰어 목록 조회
     */
    @GetMapping("/pending-reviewers")
    public ResponseEntity<List<Map<String, Object>>> getPendingReviewers(
            @PathVariable("pr-id") Long prId,
            @PathVariable("account-id") Long accountId,
            @PathVariable("repo-id") Long repoId,
            @AuthenticationPrincipal CustomUserDetail userDetail) {

        try {
            Long installationId = accountRepository.findById(accountId)
                    .orElseThrow(
                            () -> new RuntimeException("Account not found with id: " + accountId))
                    .getInstallationId();
            GitHub github = githubAppUtil.getGitHub(installationId);

            String repoFullName = repoRepository.findById(repoId)
                    .orElseThrow(
                            () -> new RuntimeException("Repository not found with id: " + repoId))
                    .getFullName();
            GHRepository repository = github.getRepository(repoFullName);
            GHPullRequest pullRequest = repository.getPullRequest(prId.intValue());

            List<Map<String, Object>> pendingReviewers = new ArrayList<>();

            // 요청된 리뷰어 목록 가져오기
            List<GHUser> requestedReviewers = pullRequest.getRequestedReviewers();

            // 이미 리뷰한 사용자들의 로그인 정보 수집
            List<String> reviewedUsers = new ArrayList<>();
            for (GHPullRequestReview review : pullRequest.listReviews()) {
                String reviewerLogin = review.getUser().getLogin();
                if (!reviewedUsers.contains(reviewerLogin)) {
                    reviewedUsers.add(reviewerLogin);
                }
            }

            // 요청된 리뷰어 중 아직 리뷰하지 않은 사람들만 필터링
            for (GHUser reviewer : requestedReviewers) {
                if (!reviewedUsers.contains(reviewer.getLogin())) {
                    Map<String, Object> reviewerInfo = new HashMap<>();
                    reviewerInfo.put("login", reviewer.getLogin());
                    reviewerInfo.put("name", reviewer.getName());
                    reviewerInfo.put("avatarUrl", reviewer.getAvatarUrl());
                    reviewerInfo.put("htmlUrl", reviewer.getHtmlUrl());
                    pendingReviewers.add(reviewerInfo);
                }
            }

            return ResponseEntity.ok(pendingReviewers);

        } catch (Exception e) {
            log.error("Error getting pending reviewers for PR #{}", prId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}