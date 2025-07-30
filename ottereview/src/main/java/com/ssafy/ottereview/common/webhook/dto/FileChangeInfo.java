package com.ssafy.ottereview.common.webhook.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FileChangeInfo {

    private String filename;
    private String status; // "added", "modified", "removed", "renamed"
    private int additions;
    private int deletions;
    private int changes;
    private String patch;
    private List<DiffHunk> diffHunks;
}
