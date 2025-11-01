package com.scholarspace.institutionservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI institutionServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ScholarSpace Institution Service API")
                        .description("Institution and Department Management Service for ScholarSpace Learning Platform. 🔒 All endpoints require ADMIN authentication.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("ScholarSpace Team")
                                .email("support@scholarspace.com")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter JWT token obtained from user-service login")));
    }
}