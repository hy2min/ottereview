package com.ssafy.ottereview.branch.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class BranchRoleCreateRequest {
    private Long id;
    private int minApproved;
}
