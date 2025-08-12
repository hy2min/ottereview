package com.ssafy.ottereview.pullrequest.service;

import com.ssafy.ottereview.pullrequest.dto.request.PullRequestCreateRequest;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestDetailResponse;
import com.ssafy.ottereview.pullrequest.dto.response.PullRequestResponse;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import java.util.List;
import org.kohsuke.github.GHRepository;
import org.springframework.web.multipart.MultipartFile;

public interface PullRequestService {
    
    /**
     * Github repoId로 Github에서 Pull Request 리스트를 조회합니다.
     */
    List<PullRequestResponse> getPullRequestsByGithub(CustomUserDetail userDetail, Long repositoryId);

    /**
     * 내가 작성한 PR 리스트를 조회합니다.
     */
    List<PullRequestResponse> getMyPullRequests(CustomUserDetail userDetail);

    /**
     * 특정 레포에 댇한 Pull Request 리스트를 조회합니다.
     */
    List<PullRequestResponse> getPullRequests(CustomUserDetail userDetail, Long repoId);

    /**
     * pr-id로 DB에 저장된 Pull Request를 조회합니다.
     */
    PullRequestDetailResponse getPullRequest(CustomUserDetail userDetail, Long repoId, Long pullRequestId);
    
    /**
     * 특정 레포지토리의 브랜치에 대한 Pull Request를 조회합니다.
     */
    PullRequestResponse getPullRequestByBranch(CustomUserDetail userDetail, Long repoId, String source, String target);
    
    /**
     *  미디어 파일과 함께 새로운 Pull Request를 생성합니다.
     *  
     *  네이밍 명확화:
     *  - Git 파일 변경 정보는 GitHub API로 가져옴
     *  - mediaFiles 파라미터 -> 업로드할 미디어 파일들 (MultipartFile[])
     *
     * @param pullRequestCreateRequest Pull Request 생성 요청 정보 (source, target 브랜치)
     * @param mediaFiles 업로드할 미디어 파일 배열 (음성, 이미지 등의 설명 첨부파일)
     */
    void createPullRequestWithMediaFiles(CustomUserDetail customUserDetail, Long repoId, 
                                       PullRequestCreateRequest pullRequestCreateRequest, MultipartFile[] mediaFiles);
    
    /**
     * Github에 있는 PullRequest를 DB에 저장합니다.
     */
    void createPullRequestFromGithub(List<GHRepository> GHRepositories);
    
}
