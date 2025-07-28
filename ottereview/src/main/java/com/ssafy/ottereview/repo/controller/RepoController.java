package com.ssafy.ottereview.repo.controller;

import com.ssafy.ottereview.repo.dto.RepoCreateRequest;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import com.ssafy.ottereview.repo.dto.RepoUpdateRequest;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.service.RepoServiceImpl;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.apache.catalina.connector.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/repositories")
public class RepoController {

    private final RepoServiceImpl repoService;

    /**
     * repoId를 가지고 Repo를 전달해주는 메소드 , methods: GET
     * @param repoId
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

    /**
     * cushion 적용 여부를 전달하는 method , 일단 해당 레포Id에 따른 cushion값을 boolean값으로 반환하는걸로 처리했다.
     * 레포조회를 통해서 repo 전체 내용을 보내는 메소드로 처리가능해보임 (추후 논의 사항)
     * @param repoId
     * @return isCushion -> boolean
     */
    @GetMapping("/{repo-id}/cushion")
    public ResponseEntity<?> getCushion(@PathVariable (name = "repo-id") Long repoId){
        Optional<Repo> repoOptional = repoService.getById(repoId);
        // repo가 실제로 존재하는지 여부 체크
        if(repoOptional.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        // Optional 객체를 Repo 객체로 변환
        Repo repo = repoOptional.get();
        return ResponseEntity.ok(repo.isCushion());
    }

    /**
     * cushion 적용 여부를 프론트에서 토글로 설정을 해놓으면 버튼 클릭시 cushion 설저을 바꾸게 한다.
     * @param repoId
     * @return repoUpdateRequest 객체 반환
     */
    @PatchMapping("/{repo-id}/cushion")
    public ResponseEntity<?> updateCushion(@PathVariable (name = "repo-id")Long repoId){
        Optional<Repo> repoOptional = repoService.getById(repoId);
        // repo가 실제로 존재하는지 여부 체크
        if(repoOptional.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        // Optional 객체를 Repo 객체로 변환
        Repo repo = repoOptional.get();
        // isCushion 값 false -> true || true -> false로 변환
        repo.cushionToggle(!repo.isCushion());
        // 바뀐값을 db에 반영하기 위해서 repoUpdateRequest 객체를 생성후 updateRepo 메소드 호출
        RepoUpdateRequest repoUpdateRequest = RepoUpdateRequest.builder().repoId(repo.getId()).isCushion(repo.isCushion()).isPrivate(repo.isPrivate()).build();
        repoService.updateRepo(repoUpdateRequest);
        return ResponseEntity.ok(repoUpdateRequest);
    }

}
