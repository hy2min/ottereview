package com.ssafy.ottereview.branch.controller;

import com.ssafy.ottereview.branch.dto.BranchResponse;
import com.ssafy.ottereview.branch.entity.Branch;
import com.ssafy.ottereview.branch.service.BranchService;
import com.ssafy.ottereview.branch.service.BranchServiceImpl;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/account/{account-id}/repositories/{repo-id}/branches")
public class BranchController {

    private final BranchServiceImpl branchServiceImpl;

    @GetMapping()
    public ResponseEntity<?> getBranchList(@PathVariable(name ="repo-id") Long repoId){
        List<Branch> branches = branchServiceImpl.getBranchesByRepoId(repoId);
        return ResponseEntity.ok(branches);
    }

    @GetMapping("/{branch-id}")
    public ResponseEntity<?> getBranchByBranchId(@PathVariable(name = "branch-id") Long branchId){
        Branch branch = branchServiceImpl.getBranchById(branchId);
        BranchResponse branchResponse = BranchResponse.builder()
                .id(branch.getId())
                .minApproveCnt(branch.getMinApproveCnt())
                .repo_id(branch.getRepo().getId())
                .build();
        return ResponseEntity.ok(branchResponse);
    }


}
