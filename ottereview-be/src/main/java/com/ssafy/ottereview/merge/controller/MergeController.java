package com.ssafy.ottereview.merge.controller;

import com.ssafy.ottereview.common.annotation.MvcController;
import com.ssafy.ottereview.merge.service.MergeService;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestDetailResponse;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.service.PullRequestService;
import com.ssafy.ottereview.pullrequest.util.PullRequestMapper;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.service.RepoService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/repositories/{repo-id}/pull-requests/{pr-id}/merges")
@MvcController
public class MergeController {

    private static final Logger log = LoggerFactory.getLogger(MergeController.class);
    private final MergeService mergeService;
    private final RepoService repoService;
    private final PullRequestService pullRequestService;
    private final PullRequestMapper pullRequestMapper;
    
    @GetMapping("/doing")
    public ResponseEntity<?> doMerge(@AuthenticationPrincipal CustomUserDetail customUserDetail,@PathVariable(name = "repo-id") Long repoId, @PathVariable(name = "pr-id") Long prId){
       return ResponseEntity.ok(mergeService.doMerge(customUserDetail, repoId, prId));
    }


    @GetMapping()
    public ResponseEntity<?> getMergeAble(@PathVariable (name = "repo-id") Long repoId, @PathVariable (name = "pr-id") Long pullRequestId, @AuthenticationPrincipal CustomUserDetail customUserDetail){
        Repo repo = repoService.getById(repoId).orElseThrow();
        User user = customUserDetail.getUser();
        PullRequestDetailResponse pullRequest = pullRequestService.getPullRequestById(customUserDetail, repoId, pullRequestId);
        PullRequest pullRequest1 = pullRequestMapper.detailResponseToEntity(pullRequest, repo, user);
        return ResponseEntity.ok(mergeService.checkMergeConflict(repo,pullRequest1));
    }

    @GetMapping("/conflicts")
    public ResponseEntity<?> getMergeConflict(@AuthenticationPrincipal CustomUserDetail customUserDetail,@PathVariable (name = "repo-id") Long repoId, @PathVariable (name = "pr-id")Long pullRequestId) throws Exception {
        Repo repo = repoService.getById(repoId).orElseThrow();
        User user = customUserDetail.getUser();
        PullRequestDetailResponse pullRequest = pullRequestService.getPullRequestById(customUserDetail, repoId, pullRequestId);
        PullRequest pullRequest1 = pullRequestMapper.detailResponseToEntity(pullRequest, repo, user);
        String url = mergeService.getHttpsUrl(repo);
        log.info(pullRequest1.getHead() +", " + pullRequest1.getBase());
        return ResponseEntity.ok(mergeService.simulateMergeAndDetectConflicts(url, pullRequest1.getBase(), pullRequest1.getHead(),repo.getAccount().getInstallationId()));
    }
}
