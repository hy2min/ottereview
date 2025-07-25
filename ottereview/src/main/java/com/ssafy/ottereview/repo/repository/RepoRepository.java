package com.ssafy.ottereview.repo.repository;

import com.ssafy.ottereview.repo.entity.Repo;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RepoRepository extends JpaRepository<Repo, Long> {
    // 레포Id를 가지고 레포지토리 조회한다.
    Optional<Repo> findById(long repoId);

    // 레포지토리 전체 조회
    List<Repo> findAllBy();

}
