package com.scholarspace.courseservice.config;

import com.scholarspace.courseservice.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public org.springframework.security.core.userdetails.UserDetailsService userDetailsService() {
        return username -> {
            throw new org.springframework.security.core.userdetails.UsernameNotFoundException("JWT-only authentication");
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Allow Swagger UI and API docs
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                
                // Allow actuator health checks
                .requestMatchers("/actuator/health").permitAll()
                
                // Allow OPTIONS requests (CORS preflight)
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // Course management - Admin only
                .requestMatchers(HttpMethod.POST, "/api/courses").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/courses/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/courses/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers("/api/courses/*/activate", "/api/courses/*/deactivate").hasAuthority("ROLE_ADMIN")
                
                // Course viewing - Allow all authenticated users
                .requestMatchers(HttpMethod.GET, "/api/courses/**").authenticated()
                
                // Instructor assignment - Admin only
                .requestMatchers("/api/instructors/*/courses/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers("/api/*/instructors/**").hasAuthority("ROLE_ADMIN")
                
                // Course viewing by instructor - Admin and Instructor access
                .requestMatchers("/api/courses/instructor/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_INSTRUCTOR")
                
                // Course content management - Instructors only
                .requestMatchers(HttpMethod.POST, "/api/course-contents").hasAuthority("ROLE_INSTRUCTOR")
                .requestMatchers(HttpMethod.PUT, "/api/course-contents/**").hasAuthority("ROLE_INSTRUCTOR")
                .requestMatchers(HttpMethod.DELETE, "/api/course-contents/**").hasAuthority("ROLE_INSTRUCTOR")
                
                // Course content viewing - All authenticated users
                .requestMatchers(HttpMethod.GET, "/api/course-contents/**").authenticated()
                
                // Enrollment requests - Students only
                .requestMatchers(HttpMethod.POST, "/api/enrollments").hasAuthority("ROLE_STUDENT")
                
                // Enrollment management - Admin only
                .requestMatchers("/api/enrollments/pending", "/api/enrollments/*/approve", "/api/enrollments/*/reject").hasAuthority("ROLE_ADMIN")
                
                // Enrollment viewing - Admin and respective users
                .requestMatchers("/api/enrollments/**").authenticated()
                
                // Submission creation - Students only
                .requestMatchers(HttpMethod.POST, "/api/submissions").hasAuthority("ROLE_STUDENT")
                
                // Grading - Instructors only
                .requestMatchers("/api/submissions/*/grade").hasAuthority("ROLE_INSTRUCTOR")
                
                // Submission viewing - Students and Instructors
                .requestMatchers(HttpMethod.GET, "/api/submissions/**").hasAnyAuthority("ROLE_STUDENT", "ROLE_INSTRUCTOR")
                
                // Dashboard stats - Admin only
                .requestMatchers("/api/dashboard/**").hasAuthority("ROLE_ADMIN")
                
                // Course stats - Allow authenticated users
                .requestMatchers("/api/courses/stats").authenticated()
                
                // Lesson generation - Teachers/Instructors only
                .requestMatchers(HttpMethod.POST, "/api/lessons/generate").hasAnyAuthority("ROLE_INSTRUCTOR", "ROLE_TEACHER", "ROLE_ADMIN")
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}