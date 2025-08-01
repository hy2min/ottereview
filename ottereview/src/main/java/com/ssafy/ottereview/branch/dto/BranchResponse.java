package com.ssafy.ottereview.branch.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class BranchResponse {
    private Long id;
    private String name;
    private int minApproveCnt;
    private Long repo_id;
}
