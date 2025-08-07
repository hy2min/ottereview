package com.ssafy.ottereview.merge.dto;

import java.util.List;
import java.util.Set;
import lombok.Builder;
import lombok.Getter;
import org.eclipse.jgit.api.MergeResult;

@Getter
@Builder
public class MergeResponse {
    Set<String> files;
    List<String> conflictFilesContents;

    public void writeConflictContents(List<String> conflictFilesContents){
        this.conflictFilesContents = conflictFilesContents;
    }
}
