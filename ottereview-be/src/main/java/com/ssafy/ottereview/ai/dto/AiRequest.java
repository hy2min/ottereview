package com.ssafy.ottereview.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class AiRequest {

    private Long repoId;
    private String source;
    private String target;
}
