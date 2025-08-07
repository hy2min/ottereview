package com.ssafy.ottereview.auth.jwt.filter;

import com.ssafy.ottereview.auth.jwt.service.TokenService;
import com.ssafy.ottereview.auth.jwt.util.JwtUtil;
import com.ssafy.ottereview.user.service.CustomUserDetailServiceImpl;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailServiceImpl customUserDetailService;

    private static final List<String> WHITELIST = List.of(
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/auth/github/callback",
            "/github-app/installation/callback",
            "/swagger-ui",
            "/v3/api-docs",
            "/error"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String uri = request.getRequestURI();

        // 1. 화이트리스트는 필터 통과
        if (isWhitelisted(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. 토큰 추출
        String accessToken = extractToken(request);

        // 3. 유효한 토큰이면 인증 설정
        if (accessToken != null && jwtUtil.validateToken(accessToken)) {
            try {
                Claims claims = jwtUtil.getClaims(accessToken);
                Long userId = Long.valueOf(claims.getSubject());
                setAuthentication(userId, request);
            } catch (Exception e) {
                log.warn("인증 정보 설정 중 오류: {}", e.getMessage());
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid authentication");
                return;
            }
        } else {
            // 4. 유효하지 않거나 없는 토큰이면 401
            log.info("401 Unauthorized: accessToken 누락 또는 유효하지 않음. URI: {}", uri);
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid token");
            return;
        }

        // 5. 필터 체인 계속 진행
        filterChain.doFilter(request, response);
    }

    private void setAuthentication(Long userId, HttpServletRequest request) {
        UserDetails userDetails = customUserDetailService.loadUserByUsername(
                String.valueOf(userId));
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    private boolean isWhitelisted(String uri) {
        return WHITELIST.stream().anyMatch(uri::startsWith);
    }

}
