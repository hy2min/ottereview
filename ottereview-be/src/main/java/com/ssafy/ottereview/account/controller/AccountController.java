package com.ssafy.ottereview.account.controller;

import com.ssafy.ottereview.account.dto.AccountResponse;
import com.ssafy.ottereview.account.service.AccountService;
import com.ssafy.ottereview.user.entity.User;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RequestMapping("/api/accounts")
@RestController
public class AccountController {
    
    private final AccountService accountService;
    
    /**
     * Github에서 계정 정보를 가져오는 API
     */
    @GetMapping("/github")
    public void getGithubAccount() {
        accountService.getGithubAccount();
    }
    
    /**
     * 특정 유저에 대한 account 정보를 가져오는 API
     */
    @GetMapping()
    public ResponseEntity<List<AccountResponse>> getAccountsByUser(User user) {
        return ResponseEntity.ok(accountService.getAccountsByUser(user));
    }
}
