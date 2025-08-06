package com.ssafy.ottereview.review.service;

import com.ssafy.ottereview.review.dto.GithubReviewResult;
import com.ssafy.ottereview.review.entity.ReviewState;
import com.ssafy.ottereview.reviewcomment.dto.ReviewCommentCreateRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public interface ReviewGithubService {
    GithubReviewResult createReviewOnGithub(Long installationId, String repoFullName, int githubPrNumber, String body, @NotNull ReviewState state, @Valid List<ReviewCommentCreateRequest.CommentItem> reviewComments, String githubUsername);
    void updateReviewCommentOnGithub(Long installationId, String repoFullName, Long githubId, String newBody, String githubUsername);
}
