package com.ssafy.ottereview.webhook.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.pullrequest.entity.PrState;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.reviewer.dto.ReviewerResponse;
import com.ssafy.ottereview.reviewer.entity.ReviewStatus;
import com.ssafy.ottereview.reviewer.entity.Reviewer;
import com.ssafy.ottereview.reviewer.repository.ReviewerRepository;
import com.ssafy.ottereview.reviewer.service.ReviewerService;
import com.ssafy.ottereview.user.dto.UserResponseDto;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import com.ssafy.ottereview.webhook.dto.PullRequestEventDto;
import com.ssafy.ottereview.webhook.dto.PullRequestEventDto.RepositoryInfo;
import com.ssafy.ottereview.webhook.dto.PullRequestWebhookInfo;
import com.ssafy.ottereview.webhook.exception.WebhookErrorCode;
import jakarta.transaction.Transactional;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor
public class PullRequestEventService {
    
    private final ObjectMapper objectMapper;
    private final PullRequestRepository pullRequestRepository;
    private final RepoRepository repoRepository;
    private final UserRepository userRepository;
    private final ReviewerService reviewerService;
    private final ReviewerRepository reviewerRepository;

    public void processPullRequestEvent(String payload) {
        try {
            PullRequestEventDto event = objectMapper.readValue(payload, PullRequestEventDto.class);
//            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
//                    .writeValueAsString(event);
//            log.debug("DTO로 받은 PR 이벤트 정보: {}\n", formattedPayload);
            JsonNode json = objectMapper.readTree(payload);
            String formattedPayload = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(json);

            log.debug("전체 페이로드 출력:\n{}", formattedPayload);
            switch (event.getAction()) {
                case "opened":
                    // mergeable 값 null
                    log.debug("PR이 열린 경우 발생하는 callback");
                    handlePullRequestOpened(event);
                    break;
                
                case "closed":
                    log.debug("PR이 닫힌 경우 발생하는 callback");
                    handlePullRequestClosed(event);
                    break;
                
                case "review_requested":
                    log.debug("PR에 리뷰어가 요청된 경우 발생하는 callback(리뷰어 개수만큼 발생)");
                    break;
                
                case "labeled":
                    log.debug("PR에 label이 추가된 경우 발생하는 callback");
                    break;
                
                case "assigned":
                    log.debug("PR에 assigned가 할당된 경우 발생하는 callback");
                    break;
                    
                case "review_request_removed":
                    log.debug("PR에 리뷰어 요청이 제거된 경우 발생하는 callback");
                    break;
                    
                case "synchronize":
                    log.debug("PR이 업데이트된 경우 발생하는 callback");
                    handlePullRequestSynchronize(event);
                    break;
                    
                case "reopened":
                    log.debug("PR이 다시 열린 경우 발생하는 callback");
                    handlePullRequestReopened(event);
                    break;
                    
                case "edited":
                    log.debug("깃허브 웹페이지에서 PR이 수정된 경우 발생하는 callback");
                    handlePullRequestSynchronize(event);
                    break;
                
                default:
                    log.warn("Unhandled action: {}", event.getAction());
            }
        } catch (Exception e) {
            throw new BusinessException(WebhookErrorCode.WEBHOOK_UNSUPPORTED_ACTION);
        }
    }
    
    private void handlePullRequestReopened(PullRequestEventDto event) {
        log.debug("[웹훅 PR 재오픈 로직 실행]");
        Long githubId = event.getPullRequest().getId();
        
        PullRequest pullRequest = pullRequestRepository.findByGithubId(githubId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "깃허브 PR ID에 해당하는 PR이 존재하지 않습니다.: " + githubId));
        
        // PR 상태를 OPEN으로 변경
        pullRequest.updateState(PrState.OPEN);
        
        log.info("Pull Request with GitHub PR number {} has been reopened.", githubId);
    }
    
    // mergeable 값을 못가져옴..
    private void handlePullRequestSynchronize(PullRequestEventDto event) {
        log.debug("[웹훅 PR 동기화 로직 실행]");
        Long githubId = event.getPullRequest().getId();
        
        PullRequest pullRequest = pullRequestRepository.findByGithubId(githubId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "깃허브 PR ID에 해당하는 PR이 존재하지 않습니다.: " + githubId));

        List<ReviewerResponse> reviewerList = reviewerService.getReviewerByPullRequest(pullRequest.getId());
        // reviewer들의 state를 none으로 바꿔야한다.
        List<Reviewer> reviewers = reviewerList.stream().map(r -> Reviewer.builder()
                .id(r.getId())
                .user(User.to(r.getUser()))
                .status(ReviewStatus.NONE)
                .pullRequest(PullRequest.to(r.getPullRequest())).build()).toList();

        // 만약 Synchronize 가 들어오면 모든 Reviewr들의 state를 None으로 초기화한다.
        reviewerRepository.saveAll(reviewers);

        pullRequest.synchronizedByWebhook(event);
    }
    
    private void handlePullRequestOpened(PullRequestEventDto event) {
        
        Long githubId = event.getPullRequest().getId();
        
        pullRequestRepository.findByGithubId(githubId)
                .ifPresentOrElse(
                        existingPullRequest -> log.debug("이미 존재하는 PR 입니다."), // 이미 존재하는 PR이므로 아무 작업도 하지 않음,
                        () -> registerPullRequest(event)
                );
    }
    
    private void handlePullRequestClosed(PullRequestEventDto event) {
        
        Long githubId = event.getPullRequest().getId();
        
        PullRequest pullRequest = pullRequestRepository.findByGithubId(githubId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "깃허브 PR ID에 해당하는 PR이 존재하지 않습니다.: " + githubId));
        
        // PR 상태를 CLOSED로 변경
        pullRequest.updateState(PrState.CLOSED);

        log.info("Pull Request with GitHub PR number {} has been closed.", githubId);
    }

    private void registerPullRequest(PullRequestEventDto event){
        PullRequestWebhookInfo pullRequest = event.getPullRequest();
        RepositoryInfo repo = event.getRepository();

        Repo targetRepo = repoRepository.findByRepoId(repo.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "해당 repository ID에 해당하는 Repo가 존재하지 않습니다.: " + repo.getId()));

        User author = userRepository.findByGithubId(pullRequest.getUser()
                        .getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "해당 사용자 ID에 해당하는 User가 존재하지 않습니다.: " + pullRequest.getUser()
                                .getId()));

        PullRequest newPullRequest = PullRequest.builder()
                .githubId(pullRequest.getId())
                .githubPrNumber(event.getNumber())
                .title(pullRequest.getTitle())
                .body(pullRequest.getBody())
                .state(PrState.fromGithubState(pullRequest.getState(), pullRequest.getMerged()))
                .author(author)
                .merged(pullRequest.getMerged() != null && pullRequest.getMerged())
                .base(pullRequest.getBase()
                        .getRef())
                .head(pullRequest.getHead()
                        .getRef())
                .mergeable(pullRequest.getMergeable() == null || pullRequest.getMergeable())
                .githubCreatedAt(pullRequest.getCreatedAt())
                .githubUpdatedAt(pullRequest.getUpdatedAt())
                .commitCnt(pullRequest.getCommits())
                .changedFilesCnt(pullRequest.getChangedFiles())
                .commentCnt(pullRequest.getComments())
                .reviewCommentCnt(pullRequest.getReviewComments())
                .htmlUrl(pullRequest.getHtmlUrl())
                .patchUrl(pullRequest.getPatchUrl())
                .issueUrl(pullRequest.getIssueUrl())
                .diffUrl(pullRequest.getDiffUrl())
                .repo(targetRepo)
                .approveCnt(0)
                .build();

        pullRequestRepository.save(newPullRequest);
    }
}
