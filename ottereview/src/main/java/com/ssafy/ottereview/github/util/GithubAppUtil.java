package com.ssafy.ottereview.github.util;

import com.ssafy.ottereview.github.config.GithubAppConfig;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import java.security.Key;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Date;
import lombok.RequiredArgsConstructor;
import org.kohsuke.github.GHAppInstallation;
import org.kohsuke.github.GHAppInstallationToken;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.GitHubBuilder;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class GithubAppUtil {
    
    private final GithubAppConfig githubAppConfig;
    private final byte[] githubAppPrivateKeyBytes;
    
    private PrivateKey getPrivateKey() throws Exception {
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(githubAppPrivateKeyBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePrivate(spec);
    }
    
    public String generateJwt(long ttlMillis) throws Exception {
        long nowMillis = System.currentTimeMillis();
        Date now = new Date(nowMillis);
        
        Key signingKey = getPrivateKey();
        
        JwtBuilder builder = Jwts.builder()
                .setIssuedAt(now)
                .setIssuer(githubAppConfig.getAppId())
                .signWith(signingKey, SignatureAlgorithm.RS256);
        
        if (ttlMillis > 0) {
            long expMillis = nowMillis + ttlMillis;
            Date exp = new Date(expMillis);
            builder.setExpiration(exp);
            System.out.println("JWT Expiration: " + exp);
        }
        
        return builder.compact();
    }
    
    public GitHub getGitHub(long installationId) {
        
        try {
            // 1. JWT 생성
            String jwtToken = generateJwt(600_000);
            
            // 2. Github 인증
            GitHub gitHubApp = new GitHubBuilder()
                    .withJwtToken(jwtToken)
                    .build();
            
            // 3. installation_token 발급
            GHAppInstallation installation = gitHubApp.getApp()
                    .getInstallationById(installationId);
            GHAppInstallationToken installationToken = installation.createToken()
                    .create();
            
            // 4. installation_token을 사용하여 GitHub 클라이언트 생성
            return new GitHubBuilder()
                    .withAppInstallationToken(installationToken.getToken())
                    .build();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("GitHub 클라이언트 생성 중 오류 발생: " + e.getMessage(), e);
        }
    }
    
    public GitHub getGitHubAsApp() {
        try {
            String jwt = generateJwt(600_000); // JWT 유효 기간 10분
            return new GitHubBuilder()
                    .withJwtToken(jwt)
                    .build();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("GitHub 클라이언트 생성 중 오류 발생: " + e.getMessage(), e);
        }
    }
}
