package com.ssafy.ottereview.pullrequest.controller;

import com.ssafy.ottereview.pullrequest.dto.PullRequestResponse;
import com.ssafy.ottereview.pullrequest.service.PullRequestService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/repositories/{repo-id}/pull-requests")
@RequiredArgsConstructor
public class PullRequestController {

    private final PullRequestService pullRequestService;

    /**
     * repositoryId에 해당하는 Pull Request 목록을 조회합니다.
     * github api를 호출해서 동기화 한 후 저장된 Pull Request 목록을 반환합니다.
     * @param repositoryId 레포지토리 ID
     * @return repositoryId에 해당하는 Pull Request 목록
     */
    @GetMapping()
    public List<PullRequestResponse> getPullRequestsByRepositoryId(@AuthenticationPrincipal CustomUserDetail userDetail, @PathVariable("repo-id") Long repositoryId) {
        return pullRequestService.getPullRequestsByRepositoryId(userDetail, repositoryId);
    }

}
