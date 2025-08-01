package com.ssafy.ottereview.pullrequest.dto.detail;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.kohsuke.github.GHPullRequestFileDetail;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PullRequestFileDetail {

    private String filename;
    private String status;
    private int additions;
    private int deletions;
    private int changes;
    private String patch;
    private String previousFilename;
    private String sha;
    private String blobUrl;
    private String rawUrl;

    public static PullRequestFileDetail from(GHPullRequestFileDetail detail) {
        PullRequestFileDetail dto = new PullRequestFileDetail();
        dto.filename = detail.getFilename();
        dto.status = detail.getStatus();
        dto.additions = detail.getAdditions();
        dto.deletions = detail.getDeletions();
        dto.changes = detail.getChanges();
        dto.patch = detail.getPatch();
        dto.previousFilename = detail.getPreviousFilename();
        dto.sha = detail.getSha();
        dto.blobUrl = detail.getBlobUrl() != null ? detail.getBlobUrl().toString() : null;
        dto.rawUrl = detail.getRawUrl() != null ? detail.getRawUrl().toString() : null;
        return dto;
    }
}
