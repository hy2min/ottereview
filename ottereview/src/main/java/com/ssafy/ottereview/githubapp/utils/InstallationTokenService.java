package com.ssafy.ottereview.githubapp.utils;

import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import java.security.Key;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Date;
import org.kohsuke.github.GHAppInstallation;
import org.kohsuke.github.GHAppInstallationToken;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.GitHubBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ssafy.ottereview.githubapp.config.GithubAppConfig;

@Service
public class InstallationTokenService {

  @Autowired
  private GithubAppConfig githubAppConfig;

  @Autowired
  private byte[] githubAppPrivateKeyBytes;

  private PrivateKey getPrivateKey() throws Exception {
    PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(githubAppPrivateKeyBytes);
    KeyFactory kf = KeyFactory.getInstance("RSA");
    return kf.generatePrivate(spec);
  }

  // 이 메서드의 이름을 더 명확하게 변경합니다.
  public String generateAppJwt(long ttlMillis) throws Exception {
    SignatureAlgorithm signatureAlgorithm = SignatureAlgorithm.RS256;

    long nowMillis = System.currentTimeMillis();
    Date now = new Date(nowMillis);

    Key signingKey = getPrivateKey();

    JwtBuilder builder = Jwts.builder()
        .setIssuedAt(now)
        .setIssuer(githubAppConfig.getAppId())
        .signWith(signingKey, signatureAlgorithm);

    if (ttlMillis > 0) {
      long expMillis = nowMillis + ttlMillis;
      Date exp = new Date(expMillis);
      builder.setExpiration(exp);
      System.out.println("JWT Expiration: " + exp);
    }

    return builder.compact();
  }

  public GitHub generateGitHubByInstallationToken(long installationId) throws Exception {
    String jwtToken = generateAppJwt(600000); // JWT 생성
    GitHub gitHubApp = new GitHubBuilder().withJwtToken(jwtToken).build();

    // 지정된 installationId에 해당하는 GHAppInstallation 객체를 가져옵니다.
    GHAppInstallation appInstallation = gitHubApp.getApp().getInstallationById(installationId);

    // 필요한 권한을 설정합니다. (예시: pull_requests 읽기 권한)
    // GHPermissionType.WRITE 로 변경하는 것 보다는 READ로 먼저 테스트하는게 안전합니다.
    // 설치 토큰을 생성합니다.
    GHAppInstallationToken appInstallationToken = appInstallation
        .createToken()
        .create();

    // 생성된 설치 토큰으로 GitHub 클라이언트 인스턴스를 빌드합니다.
    GitHub githubAuthAsInst = new GitHubBuilder()
        .withAppInstallationToken(appInstallationToken.getToken())
        .build();

    return githubAuthAsInst;
  }
}