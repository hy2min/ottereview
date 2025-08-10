package com.ssafy.ottereview.account.controller;

import com.ssafy.ottereview.account.dto.AccountResponse;
import com.ssafy.ottereview.account.service.UserAccountService;
import com.ssafy.ottereview.common.annotation.MvcController;
import com.ssafy.ottereview.user.dto.UserResponseDto;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@MvcController
public class UserAccountController {
    
    private final UserAccountService accountService;
    
    /**
     * 특정 유저에 대한 account 정보를 가져오는 API
     */
    @GetMapping("/api/users/accounts")
    @Operation(
            summary = "로그인한 유저의 계정 정보 조회",
            description = "로그인한 유저의 계정 정보를 조회합니다. 이 API는 인증된 사용자만 접근할 수 있습니다."
    )
    public ResponseEntity<List<AccountResponse>> getAccountsByUser(@AuthenticationPrincipal CustomUserDetail customUserDetail) {
        return ResponseEntity.ok(accountService.getAccountsByUser(customUserDetail));
    }

    @GetMapping("/api/accounts/{account-id}/users")
    @Operation(
            summary = "계정에 속한 유저 정보 조회",
            description = "특정 계정에 속한 유저들의 정보를 조회합니다."
    )
    public ResponseEntity<List<UserResponseDto>> getUsersByAccount(@PathVariable (name = "account-id")Long accountId){
        return ResponseEntity.ok(accountService.getUsersByAccount(accountId));
    }
}
