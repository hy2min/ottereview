package com.ssafy.ottereview.branch.service;

import com.ssafy.ottereview.branch.dto.BranchCreateRequest;
import com.ssafy.ottereview.branch.dto.BranchRoleCreateRequest;
import com.ssafy.ottereview.branch.entity.Branch;
import com.ssafy.ottereview.repo.entity.Repo;
import java.util.List;
import java.util.Optional;
import org.kohsuke.github.GHRepository;

public interface BranchService {

    /**
     * branch_id값으로 branch를 가져온다.
     * @param id
     * @return branch 객체
     */
    Branch getBranchById(Long id);

    /**
     * 사용자에게 branch 정보를 받거나 github로부터 동기화 해올때 db에 branch를 저장하는 코드
     * @param
     */
    List<Branch> createBranchList(GHRepository ghRepository, Repo repo);

    /**
     * repoId를 가지고 branch list를 가져오는 코드
     * @param repoId
     * @return
     */
    List<Branch> getBranchesByRepoId(Long repoId);

    void saveAllBranchList(List<Branch> branches);

    Branch updateBranchRole(BranchRoleCreateRequest branchRoleCreateRequest);
}
