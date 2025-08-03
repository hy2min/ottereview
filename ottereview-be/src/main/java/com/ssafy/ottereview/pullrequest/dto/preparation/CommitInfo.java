package com.ssafy.ottereview.pullrequest.dto.preparation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CommitInfo {
    
    private String sha;
    private String message;
    private String authorName;
    private String authorEmail;
    private String authorDate;
    private String committerName;
    private String committerEmail;
    private String committerDate;
    private String url;
    private String htmlUrl;
    private Integer additions;
    private Integer deletions;
    private Integer totalChanges;
    
}
