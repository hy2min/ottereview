package com.ssafy.ottereview.merge.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class MergeCheckResponse {
    int prNumber;
    String title;
    String state; //OPEN, CLOSED, MERGED
    boolean mergeable;
    String mergeState; // CLEAN, DIRTY, BLOCKED
    boolean hasConflicts;
}
