package com.ssafy.ottereview.description.service;

import com.ssafy.ottereview.description.dto.DescriptionBulkCreateRequest;
import com.ssafy.ottereview.description.dto.DescriptionCreateRequest;
import com.ssafy.ottereview.description.dto.DescriptionResponse;
import com.ssafy.ottereview.description.dto.DescriptionUpdateRequest;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface DescriptionService {

    DescriptionResponse createDescription(DescriptionCreateRequest request, Long userId, MultipartFile file);

    /**
     * Description 일괄 생성
     * PR 생성 시 여러 개의 설명을 효율적으로 처리하기 위한 메소드
     * 
     * @param request Description 일괄 생성 요청 (null 또는 빈 리스트 허용)
     * @param userId 사용자 ID
     * @param files 업로드된 파일 배열 (null 허용)
     * @return 생성된 Description 목록 (빈 리스트 반환 가능)
     */
    List<DescriptionResponse> createDescriptionsBulk(DescriptionBulkCreateRequest request, Long userId, MultipartFile[] files);

    List<DescriptionResponse> getDescriptionsByPullRequestId(Long pullRequestId);

    DescriptionResponse getDescriptionById(Long descriptionId);

    DescriptionResponse updateDescription(Long descriptionId, DescriptionUpdateRequest request, Long userId, MultipartFile file);

    void deleteDescription(Long descriptionId, Long userId);

}