package com.ssafy.ottereview.repo.dto;

import com.ssafy.ottereview.account.entity.Account;
import java.util.Objects;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class RepoCreateRequest {

    private Long repoId;

    private String fullName;

    private boolean isPrivate;
    
    private Account account;

    @Override
    public boolean equals(Object o){
        if (this == o) return true;                        // 1) 동일 참조 체크
        if (o == null || getClass() != o.getClass()) return false;  // 2) 타입 체크\
        RepoCreateRequest repoCR = (RepoCreateRequest) o;
        return (this.repoId.equals(repoCR.repoId));
    }
    @Override
    public int hashCode() {
        return Objects.hash(this.repoId);
    }
}
