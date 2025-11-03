package com.scholarspace.courseservice.controllers;

import com.scholarspace.courseservice.models.dto.LessonGenerationRequest;
import com.scholarspace.courseservice.models.dto.LessonGenerationResponse;
import com.scholarspace.courseservice.services.OpenAIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Lesson Generation", description = "AI-powered lesson plan generation using OpenAI")
public class LessonGenerationController {
    
    private final OpenAIService openAIService;

    @PostMapping("/generate")
    @Operation(
        summary = "Generate lesson plan using AI",
        description = "Generates a comprehensive lesson plan based on curriculum data using OpenAI"
    )
    @ApiResponse(responseCode = "200", description = "Lesson plan generated successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "500", description = "Error generating lesson plan")
    public ResponseEntity<?> generateLesson(@RequestBody LessonGenerationRequest request) {
        try {
            log.info("Received lesson generation request for topic: {}", request.getTopic());
            
            // Validate request
            if (request.getCurriculumData() == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Curriculum data is required");
                error.put("message", "Please provide curriculum data for lesson generation");
                return ResponseEntity.badRequest().body(error);
            }
            
            LessonGenerationResponse response = openAIService.generateLesson(request);
            log.info("Successfully generated lesson plan");
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid request: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid request");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
            
        } catch (Exception e) {
            log.error("Error generating lesson plan", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to generate lesson plan");
            error.put("message", e.getMessage() != null ? e.getMessage() : "An unexpected error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}

