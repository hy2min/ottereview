package com.ssafy.ottereview.Githubapp.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import java.io.IOException;

@Configuration
public class GithubAppConfig {

  private final ResourceLoader resourceLoader;

  @Value("${github.app.app-id}")
  private String appId;

  @Value("${github.oauth.client-id}")
  private String oauthClientId;

  @Value("${github.oauth.client-secret}")
  private String oauthClientSecret;

  public GithubAppConfig(ResourceLoader resourceLoader) {
    this.resourceLoader = resourceLoader;
  }

  public String getAppId() {
    return appId;
  }

  public String getOauthClientId() {
    return oauthClientId;
  }

  public String getOauthClientSecret() {
    return oauthClientSecret;
  }

  @Bean
  public byte[] githubAppPrivateKeyBytes(@Value("${github.app.private-key-path}") String privateKeyPath)
      throws IOException {
    Resource resource = resourceLoader.getResource(privateKeyPath);
    if (!resource.exists()) {
      throw new IOException("GitHub App private key not found at: " + privateKeyPath);
    }
    return resource.getContentAsByteArray();
  }
}