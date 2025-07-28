package com.ssafy.ottereview.branch.service;

import com.ssafy.ottereview.branch.dto.BranchCreateRequest;
import com.ssafy.ottereview.branch.entity.Branch;
import com.ssafy.ottereview.branch.repository.BranchRepository;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BranchServiceImpl implements BranchService{

    private final RepoRepository repoRepository;
    private final BranchRepository branchRepository;


    /**
     * branch_id값으로 branch를 가져온다.
     * @param id
     * @return branch 객체
     */
    @Override
    public Branch getBranchById(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException("Repo not found with ID " + id)
                );
    }

    /**
     * 사용자에게 branch 정보를 받거나 github로부터 동기화 해올때 db에 branch를 저장하는 코드
     * @param branchCreateRequest
     */
    @Override
    public void createBranch(BranchCreateRequest branchCreateRequest) {
        // repo를 찾아오는 것을  Optional<Repo>로 해놔서 아래의 코드로 존재하는지 여부 확인후 builder 패턴에 넣어야한다.
        Repo repo = repoRepository.findById(branchCreateRequest.getRepoId())
                .orElseThrow(() ->
                        new EntityNotFoundException("Repo not found with ID " + branchCreateRequest.getRepoId())
                );
        // branch table에 저장하기 위한 로직
        branchRepository.save(Branch.builder()
                .name(branchCreateRequest.getName())
                .minApproveCnt(branchCreateRequest.getMinApproveCnt())
                .repo(repo)
                .build());
    }

    /**
     * repoId를 가지고 branch list를 가져오는 코드
     * @param repoId
     * @return
     */
    @Override
    public List<Branch> getBranchesByRepoId(Long repoId) {
        return branchRepository.findAllByRepo_id(repoId);
    }

    /**
     * branch Id값을 가지고 branch 삭제가 가능하다.
     * @param id
     */
    @Override
    public void deleteBranch(Long id) {
        branchRepository.deleteById(id);
    }
}
