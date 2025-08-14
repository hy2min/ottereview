package com.ssafy.ottereview.pullrequest.dto.info;

import com.ssafy.ottereview.description.entity.Description;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PullRequestDescriptionInfo {

    private Long id;
    private String path;
    private String body;
    private String recordKey;
    private Integer position;
    private Integer startLine;
    private String startSide;
    private Integer line;
    private String side;
    private String diffHunk;
    private String voiceFileUrl;

    public static PullRequestDescriptionInfo fromEntity(Description description) {
        return PullRequestDescriptionInfo.builder()
                .id(description.getId())
                .path(description.getPath())
                .body(description.getBody())
                .recordKey(description.getRecordKey())
                .position(description.getPosition())
                .startLine(description.getStartLine())
                .startSide(description.getStartSide())
                .line(description.getLine())
                .side(description.getSide())
                .diffHunk(description.getDiffHunk())
                .build();
    }
}
