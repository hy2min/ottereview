package com.ssafy.ottereview.webhook.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.kohsuke.github.GHCompare.Commit;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PullRequestPrepareData {

    private PushEventInfo pushInfo;
    private List<Commit> commits;
    private List<FileChangeInfo> fileChanges;
}
