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
//    Map<String, String> baseFileContents;
//    Map<String, String> headFileContents;
    Map<String, String> conflictFileContents;

}
