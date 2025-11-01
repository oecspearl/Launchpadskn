package com.scholarspace.institutionservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtProperties {
    private String secret = "mySecretKey";
    private long expiration = 86400000; // 24 hours in milliseconds
}