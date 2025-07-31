package com.ssafy.ottereview.repo.repository;

import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.repo.entity.Repo;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RepoRepository extends JpaRepository<Repo, Long> {

    // 레포Id를 가지고 레포지토리 조회한다.
    Optional<Repo> findByRepoId(Long repoId);

    // 레포지토리 전체 조회
    List<Repo> findAllBy();

    @Query("SELECT r.repoId FROM Repo r WHERE r.account.id = :accountId")
    List<Long> findRepoIdsByAccountId(@Param("accountId") Long accountId);

    void deleteByAccount_IdAndRepoIdIn(Long accountId, Collection<Long> repoIds);

    List<Repo> findAllByAccount_Id(Long accountId);

    List<Repo> findAllByAccount(Account account);

    @Query("""
                SELECT
                    CASE WHEN COUNT(r) > 0
                        THEN true
                        ELSE false
                    END
                FROM Repo r JOIN r.account a JOIN UserAccount ua ON ua.account = a
                WHERE ua.user.id = :userId AND r.id = :repoId
            """)
    boolean existsByUserIdAndRepoId(@Param("userId") Long userId, @Param("repoId") Long repoId);
}
