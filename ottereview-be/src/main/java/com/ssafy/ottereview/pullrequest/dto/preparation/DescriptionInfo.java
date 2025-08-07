package com.ssafy.ottereview.pullrequest.dto.preparation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DescriptionInfo {

    private Long id;
    private String path;
    private String body;
    private String recordKey;
    private String position;
}
