package com.ssafy.ottereview.repo.controller;

import com.ssafy.ottereview.repo.dto.RepoCreateRequest;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.service.RepoServiceImpl;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.apache.catalina.connector.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/repositories")
public class RepoController {

    private final RepoServiceImpl repoService;

    /**
     * repoId를 가지고 Repo를 전달해주는 메소드 , methods: GET
     * @param repo-id
     * @return RepoResponse
     */
    @GetMapping("/{repo-id}")
    public ResponseEntity<RepoResponse> getRepoById(@PathVariable (name= "repo-id")Long repoId){
        Optional<Repo> repo = repoService.getById(repoId);
        if(repo.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        RepoResponse body = RepoResponse.of(repo.get());
        return ResponseEntity.ok(body);
    }

    /**
     * UserId를 가지고 사용자가 저장한 레포지토리 list를 반환한다.
     * @param userId
     * Method : GET
     * @return List<RepoResponse>
     */
    @GetMapping("/{user-id}/repos")
    public ResponseEntity<List<RepoResponse>> getReposByUserId(@PathVariable (name = "user-id") Long userId) {
        List<RepoResponse> body = repoService.getReposByUserId(userId);
        return ResponseEntity.ok(body);

    }

}
