package com.ssafy.ottereview.webhook.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class PushEventDto {
    
    private String ref;
    private String branchName;
    private String repoFullName;
    private Long repoId;
    private String defaultBranch;
    private String pusherName;
    private String pusherEmail;
    private boolean isNewBranch;
    private boolean isDeleted;
    private boolean isForced;
    private String beforeSha;
    private String afterSha;
    private List<String> commitShas;
    private int commitCount;
    private Long installationId;
}
