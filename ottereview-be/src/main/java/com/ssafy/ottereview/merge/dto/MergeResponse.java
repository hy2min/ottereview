package com.ssafy.ottereview.merge.dto;

import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.Builder;
import lombok.Getter;
import org.eclipse.jgit.api.MergeResult;

@Getter
@Builder
public class MergeResponse {
    Set<String> files;
    List<String> conflictFilesContents;
    Map<String, String> baseFileContents;
    Map<String, String> headFileContents;

    public void writeConflictContents(List<String> conflictFilesContents){
        this.conflictFilesContents = conflictFilesContents;
    }
}
