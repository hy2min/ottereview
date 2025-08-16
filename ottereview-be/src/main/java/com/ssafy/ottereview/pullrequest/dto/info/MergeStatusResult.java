package com.ssafy.ottereview.pullrequest.dto.info;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class MergeStatusResult {
    
    private boolean allApproved;
    private int approvedCount;
}
