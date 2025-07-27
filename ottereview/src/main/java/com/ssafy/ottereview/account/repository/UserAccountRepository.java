package com.ssafy.ottereview.account.repository;

import com.ssafy.ottereview.account.entity.UserAccount;
import com.ssafy.ottereview.user.entity.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    
    List<UserAccount> findAllByUser(User user);
}
