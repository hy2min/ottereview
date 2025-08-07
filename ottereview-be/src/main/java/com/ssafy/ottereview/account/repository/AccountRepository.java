package com.ssafy.ottereview.account.repository;

import com.ssafy.ottereview.account.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    
    Account findByInstallationId(Long installationId);
    
    Account findByGithubId(Long githubId);
    
    void deleteByGithubId(Long githubId);
}
