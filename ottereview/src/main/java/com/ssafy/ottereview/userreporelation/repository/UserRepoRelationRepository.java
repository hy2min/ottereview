package com.ssafy.ottereview.userreporelation.repository;

import com.ssafy.ottereview.userreporelation.entity.UserRepoRelation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepoRelationRepository extends JpaRepository<UserRepoRelation, Long> {

    List<UserRepoRelation> findByUser_Id(Long userId);

    // repoId와 userId를 가지고 Role을 찾을 수 있다.
    Optional<UserRepoRelation> findByUserIdAndRepoId(Long userId, Long repoId);
}
