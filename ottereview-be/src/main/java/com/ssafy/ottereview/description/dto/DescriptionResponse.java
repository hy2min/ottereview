package com.ssafy.ottereview.description.dto;

import com.ssafy.ottereview.description.entity.Description;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Builder(toBuilder = true)
@Getter
public class DescriptionResponse {

    private Long id;

    private Long userId;

    private String userName;

    private Long pullRequestId;

    private String path;

    private String body;

    private String recordKey;

    private Integer position;

    private Integer line;

    private String side;

    private Integer startLine;

    private String startSide;

    private LocalDateTime createdAt;

    private LocalDateTime modifiedAt;

    /** 음성 파일 URL (recordKey가 있을 때만) */
    private String voiceFileUrl;

    public static DescriptionResponse from(Description description) {
        return DescriptionResponse.builder()
                .id(description.getId())
                .userId(description.getUser().getId())
                .userName(description.getUser().getGithubUsername())
                .pullRequestId(description.getPullRequest().getId())
                .path(description.getPath())
                .body(description.getBody())
                .recordKey(description.getRecordKey())
                .position(description.getPosition())
                .line(description.getLine())
                .side(description.getSide())
                .startLine(description.getStartLine())
                .startSide(description.getStartSide())
                .createdAt(description.getCreatedAt())
                .modifiedAt(description.getModifiedAt())
                .voiceFileUrl(null) // 서비스에서 별도 설정
                .build();
    }
}