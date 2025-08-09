package com.ssafy.ottereview.description.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 설명(Description) 일괄 생성을 위한 요청 DTO
 * PR 생성 시 여러 개의 설명을 한 번에 처리하기 위해 사용
 */
@Builder
@Getter
public class DescriptionBulkCreateRequest {

    /**
     * Pull Request ID
     */
    @NotNull(message = "Pull Request ID는 필수입니다")
    private Long pullRequestId;

    /**
     * 일괄 생성할 설명 목록
     * 빈 리스트이거나 null일 수 있음 (유효성 검증에서 허용)
     */
    @Valid
    private List<DescriptionItemRequest> descriptions;

    /**
     * 개별 설명 항목을 위한 내부 DTO
     */
    @Builder
    @Getter
    public static class DescriptionItemRequest {
        /**
         * 파일 경로 (필수)
         */
        @NotNull(message = "파일 경로는 필수입니다")
        private String path;

        /**
         * 설명 내용 (텍스트 또는 AI로 처리될 음성 파일의 결과)
         */
        private String body;

        /**
         * 파일 인덱스 (MultipartFile 배열에서의 인덱스)
         * null이면 파일 없음을 의미
         */
        private Integer fileIndex;

        /**
         * 코드 위치 정보
         */
        private Integer position;
        private Integer line;
        private String side;
        private Integer startLine;
        private String startSide;
        
        /**
         * diff hunk 정보 (변경된 코드 블록)
         */
        private String diffHunk;
    }
}