package com.ssafy.ottereview.repo.service;

import com.ssafy.ottereview.repo.dto.RepoCreateRequest;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import com.ssafy.ottereview.repo.dto.RepoUpdateRequest;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import java.util.List;
import java.util.Optional;

public interface RepoService {
    /***
     * repoId를 가지고 Repo 객체를 가져오는 메서드
     * 매개변수 : id , type : Long
     * 성격 : Read
     */
    Optional<Repo> getById(Long id);

    /***
     * repository 생성
     * 매개변수 : RepoCreateRequest
     * 성격 : Create
     */
    public void createRepo(RepoCreateRequest repoCreateRequest);

    /***
     * Repository 정보 update
     * 매개변수 : RepoUpdateRequest
     * 성격 : Update
     */
    public void updateRepo(RepoUpdateRequest repoUpdateRequest);

    /***
     * Repository 정보 삭제
     * 매개변수 : repoId(Long)
     * 성격 : delete
     *
     */
    public void deleteRepo(Long id);

    /**
     * UserId를 가지고 User가 가지고 있는 모든 레포지토리를 가져온다.
     */
    public List<RepoResponse> getReposByUserId(Long userId);
}
