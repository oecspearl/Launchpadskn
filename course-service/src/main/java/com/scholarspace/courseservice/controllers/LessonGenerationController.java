package com.scholarspace.courseservice.controllers;

import com.scholarspace.courseservice.models.dto.LessonGenerationRequest;
import com.scholarspace.courseservice.models.dto.LessonGenerationResponse;
import com.scholarspace.courseservice.services.OpenAIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
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
    public ResponseEntity<LessonGenerationResponse> generateLesson(@RequestBody LessonGenerationRequest request) {
        try {
            LessonGenerationResponse response = openAIService.generateLesson(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate lesson: " + e.getMessage(), e);
        }
    }
}

