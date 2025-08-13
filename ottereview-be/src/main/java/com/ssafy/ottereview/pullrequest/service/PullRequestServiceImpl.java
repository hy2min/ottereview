package com.ssafy.ottereview.pullrequest.service;

import com.ssafy.ottereview.account.service.UserAccountService;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.description.dto.DescriptionBulkCreateRequest;
import com.ssafy.ottereview.description.dto.DescriptionResponse;
import com.ssafy.ottereview.description.exception.DescriptionErrorCde;
import com.ssafy.ottereview.description.repository.DescriptionRepository;
import com.ssafy.ottereview.description.service.DescriptionService;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.githubapp.dto.GithubPrResponse;
import com.ssafy.ottereview.preparation.dto.DescriptionInfo;
import com.ssafy.ottereview.preparation.dto.PrUserInfo;
import com.ssafy.ottereview.preparation.dto.PreparationResult;
import com.ssafy.ottereview.preparation.repository.PreparationRedisRepository;
import com.ssafy.ottereview.priority.entity.Priority;
import com.ssafy.ottereview.priority.repository.PriorityRepository;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestDescriptionInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestPriorityInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestReviewCommentInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestReviewInfo;
import com.ssafy.ottereview.pullrequest.dto.info.PullRequestReviewerInfo;
import com.ssafy.ottereview.pullrequest.dto.request.PullRequestCreateRequest;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestDetailResponse;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestValidationResponse;
import com.ssafy.ottereview.pullrequest.entity.PrState;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.exception.PullRequestErrorCode;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.pullrequest.util.PullRequestMapper;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.exception.RepoErrorCode;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.review.repository.ReviewRepository;
import com.ssafy.ottereview.reviewcomment.entity.ReviewComment;
import com.ssafy.ottereview.reviewcomment.repository.ReviewCommentRepository;
import com.ssafy.ottereview.reviewer.entity.ReviewStatus;
import com.ssafy.ottereview.reviewer.entity.Reviewer;
import com.ssafy.ottereview.reviewer.repository.ReviewerRepository;
import com.ssafy.ottereview.s3.service.S3Service;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.exception.UserErrorCode;
import com.ssafy.ottereview.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHIssueState;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GHUser;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RequiredArgsConstructor
@Service
@Transactional
public class PullRequestServiceImpl implements PullRequestService {
    
    private final GithubApiClient githubApiClient;
    private final PullRequestRepository pullRequestRepository;
    private final RepoRepository repoRepository;
    private final UserRepository userRepository;
    private final ReviewerRepository reviewerRepository;
    private final UserAccountService userAccountService;
    private final PriorityRepository priorityRepository;
    private final DescriptionRepository descriptionRepository;
    private final PullRequestMapper pullRequestMapper;
    private final PreparationRedisRepository preparationRedisRepository;
    private final DescriptionService descriptionService;
    private final ReviewRepository reviewRepository;
    private final ReviewCommentRepository reviewCommentRepository;
    private final S3Service s3Service;
    
    @Override
    public List<PullRequestResponse> getPullRequests(CustomUserDetail customUserDetail, Long repoId) {
        // 1. 사용자 권한 검증 및 레포지토리 조회
        Repo targetRepo = userAccountService.validateUserPermission(customUserDetail.getUser()
                .getId(), repoId);
        
        // 2. 해당 레포지토리의 Pull Request 목록 조회
//        Pageable pageable = PageRequest.of(page,size, Sort.by(Sort.Direction.DESC,"githubCreatedAt"));
        List<PullRequest> pullRequests = pullRequestRepository.findAllByRepo(targetRepo);
        
        // 3. Pull Request 목록을 DTO로 변환하여 반환
        return pullRequests.stream()
                .map(pullRequest -> {
                    return PullRequestResponse.fromEntityAndIsApproved(pullRequest, checkMergeStatus(pullRequest));
                })
                .toList();
    }
    
    private Boolean checkMergeStatus(PullRequest pullRequest) {
        // Reviewer 모두 APPROVED인지 확인
        List<Reviewer> reviewers = reviewerRepository.findByPullRequest(pullRequest);
        return reviewers.stream()
                .allMatch(r -> r.getStatus() == ReviewStatus.APPROVED);
    }
    
    @Override
    public List<PullRequestResponse> getPullRequestsByGithub(CustomUserDetail userDetail,
            Long repoId) {
        
        Repo targetRepo = userAccountService.validateUserPermission(userDetail.getUser()
                .getId(), repoId);
        
        // 2. Repo 엔티티에서 GitHub 저장소 이름과 설치 ID를 가져온다.
        String repositoryFullName = targetRepo.getFullName();
        Long installationId = targetRepo.getAccount()
                .getInstallationId();
        
        // 3. GitHub API를 호출하여 해당 레포지토리의 Pull Request 목록을 가져온다.
        List<GithubPrResponse> githubPrResponses = githubApiClient.getPullRequests(installationId,
                repositoryFullName);
        
        // 4~8. GitHub PR과 DB PR 동기화
        synchronizePullRequestsWithGithub(githubPrResponses, targetRepo, userDetail.getUser());
        
        // 9. 최종 결과 조회 및 반환 (삭제된 PR 제외)
//        Pageable pageable = PageRequest.of(0,6, Sort.by(Sort.Direction.DESC,"githubCreatedAt"));
        
        List<PullRequest> finalPullRequests = pullRequestRepository.findAllByRepo(targetRepo);
        
        return finalPullRequests.stream()
                .map(pullRequestMapper::PullRequestToResponse)
                .toList();
    }
    
    @Override
    public List<PullRequestResponse> getMyPullRequests(CustomUserDetail customUserDetail) {
        User loginUser = userRepository.findById(customUserDetail.getUser()
                        .getId())
                .orElseThrow(() -> new BusinessException(UserErrorCode.USER_NOT_FOUND));
        
        List<PullRequest> pullRequests = pullRequestRepository.findAllByAuthor(loginUser)
                .stream()
                .filter(pr -> pr.getState()
                        .equals(PrState.OPEN))
                .toList();
        
        return pullRequests.stream()
                .map(pullRequestMapper::PullRequestToResponse)
                .toList();
    }
    
    @Override
    public PullRequestDetailResponse getPullRequest(CustomUserDetail customUserDetail,
            Long repoId, Long prId) {
        
        Repo repo = userAccountService.validateUserPermission(customUserDetail.getUser()
                .getId(), repoId);
        
        PullRequest pullRequest = pullRequestRepository.findById(prId)
                .orElseThrow(() -> new BusinessException(PullRequestErrorCode.PR_NOT_FOUND));
        
        PullRequestDetailResponse pullRequestDetailResponse = githubApiClient.getPullRequestDetail(prId, repo.getFullName());
        
        // 리뷰어 추가
        List<PullRequestReviewerInfo> reviewers = reviewerRepository.findAllByPullRequest(pullRequest)
                .stream()
                .map(PullRequestReviewerInfo::fromEntity)
                .toList();
        
        // Description 추가
        
        List<PullRequestDescriptionInfo> descriptions = descriptionRepository.findAllByPullRequest(pullRequest)
                .stream()
                .map(PullRequestDescriptionInfo::fromEntity)
                .toList();
        
        // Review 추가
        List<PullRequestReviewInfo> reviews = reviewRepository.findAllByPullRequest(pullRequest)
                .stream()
                .map(review -> {
                    List<PullRequestReviewCommentInfo> reviewComments = reviewCommentRepository.findAllByReview(review)
                            .stream()
                            .map(reviewComment -> {
                                String voiceFileUrl = null;
                                if (reviewComment.getRecordKey() != null) {
                                    try {
                                        voiceFileUrl = s3Service.generatePresignedUrl(reviewComment.getRecordKey(), 60);
                                    } catch (Exception e) {
                                        // URL 생성 실패 시 null 처리
                                        log.debug("음성 파일 URL 생성 실패: null 반환 {}", e.getMessage());
                                    }
                                }
                                return PullRequestReviewCommentInfo.fromEntity(reviewComment, voiceFileUrl);
                            })
                            .toList();
                    return PullRequestReviewInfo.fromEntityAndReviewComment(review, reviewComments);
                })
                .toList();
        
        // 우선순위 추가
        List<PullRequestPriorityInfo> priorities = priorityRepository.findAllByPullRequest(pullRequest)
                .stream()
                .map(PullRequestPriorityInfo::fromEntity)
                .toList();
        
        pullRequestDetailResponse.enrollDescription(descriptions);
        pullRequestDetailResponse.enrollReviewers(reviewers);
        pullRequestDetailResponse.enrollReview(reviews);
        pullRequestDetailResponse.enrollPriorities(priorities);
        
        return pullRequestDetailResponse;
    }

    @Override
    public PullRequestValidationResponse getPullRequestByBranch(CustomUserDetail userDetail, Long repoId, String source, String target) {
        
        Repo repo = userAccountService.validateUserPermission(userDetail.getUser()
                .getId(), repoId);
        
        Optional<PullRequest> existPullRequest = pullRequestRepository.findByRepoAndBaseAndHeadAndState(repo, target, source, PrState.OPEN);
        
        if (existPullRequest.isPresent()) {
            return new PullRequestValidationResponse(true, existPullRequest.get()
                    .getId());
        }
        
        return new PullRequestValidationResponse(false, null);
    }
    
    @Override
    public void createPullRequestWithMediaFiles(CustomUserDetail customUserDetail, Long repoId,
            PullRequestCreateRequest request, MultipartFile[] mediaFiles) {
        
        GithubPrResponse prResponse = null;
        
        try {
            Repo repo = userAccountService.validateUserPermission(customUserDetail.getUser()
                    .getId(), repoId);
            
            // redis 캐시에서 PR 생성 가능 여부 확인
            PreparationResult prepareInfo = preparationRedisRepository.getPrepareInfo(repoId, request.getSource(), request.getTarget());
            
            if (prepareInfo == null || !prepareInfo.getIsPossible()) {
                throw new BusinessException(PullRequestErrorCode.PR_VALIDATION_FAILED);
            }
            
            // PR 생성 검증
            validatePullRequestCreation(prepareInfo, repo);
            
            // PR 생성
            prResponse = GithubPrResponse.from(githubApiClient.createPullRequest(repo.getAccount()
                    .getInstallationId(), repo.getFullName(), prepareInfo.getTitle(), prepareInfo.getBody(), request.getSource(), request.getTarget())
            );
            
            // PR 저장
            PullRequest pullRequest = pullRequestMapper.githubPrResponseToEntity(prResponse, customUserDetail.getUser(), repo);
            PrUserInfo prepareAuthor = prepareInfo.getAuthor();
            User author = userRepository.findById(prepareAuthor.getId())
                    .orElseThrow(() -> new BusinessException(UserErrorCode.USER_NOT_FOUND));
            
            pullRequest.enrollAuthor(author);
            
            pullRequest.enrollSummary(prepareInfo.getSummary());
            PullRequest savePullRequest = pullRequestRepository.save(pullRequest);
            
            // 리뷰어 저장
            List<PrUserInfo> reviewers = prepareInfo.getReviewers();
            
            List<User> userList = reviewers.stream()
                    .map(this::getUserFromUserInfo)
                    .toList();

            if(prepareInfo.getReviewers() != null) {
                List<Reviewer> reviewerList = userList.stream()
                        .map(user -> Reviewer.builder()
                                .pullRequest(savePullRequest)
                                .user(user)
                                .status(ReviewStatus.NONE)
                                .build())
                        .toList();

                reviewerRepository.saveAll(reviewerList);
                log.debug("리뷰어 저장 완료, 리뷰어 수: {}", reviewerList.size());
            }
            // 우선 순위 저장
            if(prepareInfo.getPriorities() != null) {

                List<Priority> priorityList = prepareInfo.getPriorities()
                        .stream()
                        .map((priorityInfo) -> Priority.builder()
                                .pullRequest(savePullRequest)
                                .title(priorityInfo.getTitle())
                                .level(priorityInfo.getLevel())
                                .content(priorityInfo.getContent())
                                .build())
                        .toList();

                priorityRepository.saveAll(priorityList);
                log.debug("우선 순위 저장 완료, 우선 순위 수: {}", priorityList.size());
            }
            // 작성자 설명 저장 - 새로운 일괄 생성 방식 사용
            createDescriptionsWithService(prepareInfo, savePullRequest, customUserDetail.getUser()
                    .getId(), mediaFiles);
        } catch (Exception e) {
            log.error("Pull Request 생성 중 오류 발생: {}", e.getMessage(), e);
            // 오류 발생 시 Github PR 삭제
            try {
                if (prResponse != null) {
                    Repo repo = repoRepository.findById(repoId)
                            .orElseThrow(() -> new BusinessException(RepoErrorCode.REPO_NOT_FOUND));
                    
                    githubApiClient.closePullRequest(repo.getAccount()
                            .getInstallationId(), repo.getFullName(), prResponse.getGithubPrNumber());
                }
            } catch (Exception deleteEx) {
                log.error("Pull Request 삭제 중 오류 발생: {}", deleteEx.getMessage(), deleteEx);
                throw new BusinessException(PullRequestErrorCode.PR_CREATE_FAILED, "PR 생성 중 오류가 발생하였고, PR 삭제에도 실패하였습니다.");
            }
        }
    }
    
    /**
     * DescriptionService를 사용한 설명 일괄 생성 develop 브랜치의 PreparationResult 구조에 맞춰 수정
     */
    private void createDescriptionsWithService(PreparationResult prepareInfo, PullRequest pullRequest,
            Long userId, MultipartFile[] files) {
        // prepareInfo에서 descriptions가 없거나 비어있는 경우 처리
        List<DescriptionInfo> descriptions = Optional.ofNullable(prepareInfo.getDescriptions())
                .orElse(List.of());
        
        if (descriptions.isEmpty() && (files == null || files.length == 0)) {
            log.debug("생성할 설명이 없어 설명 저장을 건너뜁니다.");
            return;
        }
        
        // DescriptionInfo를 DescriptionBulkCreateRequest.DescriptionItemRequest로 변환
        List<DescriptionBulkCreateRequest.DescriptionItemRequest> descriptionItems = descriptions.stream()
                .map(info -> DescriptionBulkCreateRequest.DescriptionItemRequest.builder()
                        .path(info.getPath())
                        .body(info.getBody())
                        .position(info.getPosition())
                        .line(info.getLine())
                        .side(info.getSide())
                        .startLine(info.getStartLine())
                        .startSide(info.getStartSide())
                        .diffHunk(info.getDiffHunk())
                        .fileIndex(null) // 파일 매핑은 서비스에서 처리
                        .build())
                .toList();
        
        // 파일만 있고 description 정보가 없는 경우를 위한 처리
        if (descriptionItems.isEmpty() && files != null && files.length > 0) {
            throw new BusinessException(DescriptionErrorCde.DESCRIPTION_CREATE_FAILED, "설명 정보가 없고, 파일만 있는 경우는 허용되지 않습니다.");
        }
        
        if (!descriptionItems.isEmpty()) {
            DescriptionBulkCreateRequest bulkRequest = DescriptionBulkCreateRequest.builder()
                    .pullRequestId(pullRequest.getId())
                    .descriptions(descriptionItems)
                    .build();
            
            // DescriptionService를 통한 일괄 생성
            List<DescriptionResponse> createdDescriptions = descriptionService.createDescriptionsBulk(
                    bulkRequest, userId, files);
            
            log.debug("설명 일괄 생성 완료, 생성된 설명 수: {}", createdDescriptions.size());
        }
    }
    
    @Override
    public void createPullRequestFromGithub(List<GHRepository> githubRepositories) {
        
        try {
            //6. Repo 별 PR 생성
            for (GHRepository repo : githubRepositories) {
                log.info("Repo ID: {}, Full Name: {}, Private: {}",
                        repo.getId(), repo.getFullName(), repo.isPrivate());
                
                List<GithubPrResponse> githubPrResponses = repo.queryPullRequests()
                        .state(GHIssueState.OPEN)
                        .list()
                        .toList()
                        .stream()
                        .map(GithubPrResponse::from)
                        .toList();
                
                // 1. repositoryId로 Repo 엔티티를 조회한다.
                Repo targetRepo = repoRepository.findByRepoId(repo.getId())
                        .orElseThrow(() -> new BusinessException(RepoErrorCode.REPO_NOT_FOUND));
                
                // 2. GitHub PR 응답을 PullRequest 엔티티로 변환
                List<PullRequest> newPullRequests = new ArrayList<>();
                List<Reviewer> newReviewers = new ArrayList<>();
                for (GithubPrResponse githubPr : githubPrResponses) {
                    
                    log.info("github title: {}", githubPr.getTitle());
                    
                    log.info("github id: {} ", githubPr.getAuthor()
                            .getId());
                    log.info("github name: {}", githubPr.getAuthor()
                            .getName());
                    log.info("github email: {}", githubPr.getAuthor()
                            .getEmail());
                    log.info("github Login: {}", githubPr.getAuthor()
                            .getLogin());
                    log.info("github type: {}", githubPr.getAuthor()
                            .getType());
                    
                    User author = userRepository.findByGithubId(githubPr.getAuthor()
                                    .getId())
                            .orElseGet(() -> registerUser(githubPr.getAuthor()));
                    
                    PullRequest pullRequest = pullRequestMapper.githubPrResponseToEntity(githubPr, author, targetRepo);
                    
                    List<GHUser> users = githubPr.getRequestedReviewers();
                    for (GHUser user : users) {
                        User reviewer = userRepository.findByGithubId(user
                                        .getId())
                                .orElseGet(() -> registerUser(user));
                        
                        log.info("reviewer 추가 로직, 이름: " + user.getName() + "pullrequest Id: "
                                + pullRequest.getId());
                        
                        newReviewers.add(
                                Reviewer.builder()
                                        .pullRequest(pullRequest)
                                        .user(reviewer)
                                        .status(ReviewStatus.NONE)
                                        .build());
                    }
                    newPullRequests.add(pullRequest);
                }
                
                if (!newPullRequests.isEmpty()) {
                    pullRequestRepository.saveAll(newPullRequests);
                    reviewerRepository.saveAll(newReviewers);
                }
            }
        } catch (Exception e) {
            throw new BusinessException(PullRequestErrorCode.PR_CREATE_FAILED);
        }
        
    }
    
    private User registerUser(GHUser ghUser) {
        try {
            User user = User.builder()
                    .githubId(ghUser.getId())
                    .githubUsername(ghUser.getLogin())
                    .githubEmail(ghUser.getEmail() != null ? ghUser.getEmail() : null)
                    .type(ghUser.getType())
                    .profileImageUrl(ghUser.getAvatarUrl() != null ? ghUser.getAvatarUrl()
                            .toString() : null)
                    .rewardPoints(0)
                    .userGrade("BASIC")
                    .build();
            
            return userRepository.save(user);
        } catch (Exception e) {
            throw new BusinessException(UserErrorCode.USER_REGISTRATION_FAILED);
        }
    }
    
    private User getUserFromUserInfo(PrUserInfo prUserInfo) {
        return userRepository.findById(prUserInfo.getId())
                .orElseThrow(() -> new BusinessException(UserErrorCode.USER_NOT_FOUND));
    }
    
    /**
     * pullRequest 생성 시 필요한 정보가 모두 있는지 검증하는 메서드
     */
    private void validatePullRequestCreation(PreparationResult preparationResult, Repo repo) {
        if (preparationResult.getSource() == null || preparationResult.getTarget() == null || preparationResult.getTitle() == null || repo.getFullName() == null) {
            throw new BusinessException(PullRequestErrorCode.PR_VALIDATION_FAILED);
        }
    }
    
    /**
     * GitHub에서 가져온 PR 정보와 DB의 PR을 동기화하는 메서드
     *
     * @param githubPrResponses GitHub에서 가져온 PR 목록
     * @param targetRepo        대상 저장소
     * @param user              사용자 정보
     */
    private void synchronizePullRequestsWithGithub(List<GithubPrResponse> githubPrResponses,
            Repo targetRepo, User user) {
        
        List<PullRequest> existingPullRequests = pullRequestRepository.findAllByRepo(targetRepo);
        
        Map<Integer, PullRequest> existingPrMap = existingPullRequests.stream()
                .collect(Collectors.toMap(PullRequest::getGithubPrNumber, pr -> pr));
        
        // 5. GitHub에서 가져온 PR 번호 Set
        Set<Integer> githubPrNumbers = githubPrResponses.stream()
                .map(GithubPrResponse::getGithubPrNumber)
                .collect(Collectors.toSet());
        
        // 6. 새로운 PR과 기존 PR을 비교하여 저장할 Pull Request 목록을 준비한다.
        List<PullRequest> pullRequestsToSave = new ArrayList<>();
        
        for (GithubPrResponse githubPr : githubPrResponses) {
            PullRequest existingPr = existingPrMap.get(githubPr.getGithubPrNumber());
            
            if (existingPr == null) {
                // 6-1. 새로운 PR: 생성
                PullRequest newPr = pullRequestMapper.githubPrResponseToEntity(githubPr, user, targetRepo);
                newPr.enrollRepo(targetRepo);
                pullRequestsToSave.add(newPr);
            } else {
                // 6-2. 기존 PR: 업데이트 (변경사항이 있는 경우만)
                if (existingPr.hasChangedFrom(githubPr)) {
                    existingPr.updateFromGithub(githubPr);
                    pullRequestsToSave.add(existingPr);
                }
            }
        }
        
        // 7. 깃허브에 없는 PR들을 삭제 처리한다.
        List<PullRequest> prsToMarkAsDeleted = existingPullRequests.stream()
                .filter(pr -> !githubPrNumbers.contains(pr.getGithubPrNumber()))
                .toList();
        
        pullRequestRepository.deleteAll(prsToMarkAsDeleted);
        
        if (!pullRequestsToSave.isEmpty()) {
            pullRequestRepository.saveAll(pullRequestsToSave);
            log.info("총 {}개의 PR이 동기화되었습니다.", pullRequestsToSave.size());
        }
    }
    
    @Override
    @Transactional
    public void closePullRequest(CustomUserDetail userDetail, Long repoId, Long pullRequestId) {
        Repo repo = userAccountService.validateUserPermission(userDetail.getUser()
                .getId(), repoId);
        
        PullRequest pullRequest = pullRequestRepository.findById(pullRequestId)
                .orElseThrow(() -> new BusinessException(PullRequestErrorCode.PR_NOT_FOUND));
        
        // 1. GitHub에서도 PR을 닫음
        Long installationId = repo.getAccount()
                .getInstallationId();
        String repositoryName = repo.getFullName();
        Integer githubPrNumber = pullRequest.getGithubPrNumber();
        
        githubApiClient.closePullRequest(installationId, repositoryName, githubPrNumber);
        
        // 2. DB에서 PR 상태를 CLOSED로 변경
        pullRequest.updateState(PrState.CLOSED);
    }
    
    @Override
    @Transactional
    public void reopenPullRequest(CustomUserDetail userDetail, Long repoId, Long pullRequestId) {
        Repo repo = userAccountService.validateUserPermission(userDetail.getUser()
                .getId(), repoId);
        
        PullRequest pullRequest = pullRequestRepository.findById(pullRequestId)
                .orElseThrow(() -> new BusinessException(PullRequestErrorCode.PR_NOT_FOUND));
        
        if (pullRequestRepository.existsByRepoAndBaseAndHeadAndState(repo, pullRequest.getBase(), pullRequest.getHead(), PrState.OPEN)) {
            throw new BusinessException(PullRequestErrorCode.PR_ALREADY_OPEN);
        }
        
        // 1. GitHub에서도 PR을 다시 염
        Long installationId = repo.getAccount()
                .getInstallationId();
        String repositoryName = repo.getFullName();
        Integer githubPrNumber = pullRequest.getGithubPrNumber();
        
        githubApiClient.reopenPullRequest(installationId, repositoryName, githubPrNumber);
        
        // 2. DB에서 PR 상태를 OPEN 변경
        pullRequest.updateState(PrState.OPEN);
    }
}
