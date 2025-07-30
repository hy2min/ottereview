package com.ssafy.ottereview.common.webhook.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.kohsuke.github.GHCommit;
import org.kohsuke.github.GHCompare.Commit;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PullRequestData {

    private PushEventInfo pushInfo;
    private List<Commit> commits;
    private List<GHCommit.File> changedFiles;
    private List<FileChangeInfo> fileChanges;
    private String title;
    private String body;
}
