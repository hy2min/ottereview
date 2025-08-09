package com.ssafy.ottereview.preparation.dto;

import java.net.URL;
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
    private String status;
    private int additions;
    private int deletions;
    private int changes;
    private String patch;
    private URL rawUrl;
    private URL blobUrl;
    private List<DiffHunk> diffHunks;
}
