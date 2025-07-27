package com.ssafy.ottereview.user.repository;

import com.ssafy.ottereview.user.entity.User;
import java.util.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByGithubEmail(String githubEmail);
}
