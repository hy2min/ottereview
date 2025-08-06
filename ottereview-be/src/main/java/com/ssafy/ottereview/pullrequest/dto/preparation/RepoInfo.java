package com.ssafy.ottereview.pullrequest.dto.preparation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepoInfo {

    private Long id;
    private String fullName;

    public static RepoInfo of(Long id, String fullName) {
        return RepoInfo.builder()
                .id(id)
                .fullName(fullName)
                .build();
    }
}
