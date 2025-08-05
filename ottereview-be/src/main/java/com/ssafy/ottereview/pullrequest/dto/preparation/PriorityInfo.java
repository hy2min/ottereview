package com.ssafy.ottereview.pullrequest.dto.preparation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriorityInfo {

    private Long id;
    private int idx;
    private String title;
    private String content;

    public static PriorityInfo of(Long id, int idx, String title, String content) {
        return PriorityInfo.builder()
                .id(id)
                .idx(idx)
                .title(title)
                .content(content)
                .build();
    }
}
