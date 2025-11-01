package com.scholarspace.courseservice.controllers;

import com.scholarspace.courseservice.models.Submission;
import com.scholarspace.courseservice.services.SubmissionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
@Tag(name = "Assignment Submissions", description = "APIs for managing assignment submissions. Students can submit assignments and instructors can grade them.")
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping
    public ResponseEntity<?> submitAssignment(
            @RequestParam("contentId") Long contentId,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication) {
        
        try {
            Long studentId = getUserIdFromAuth(authentication);
            Submission submission = submissionService.submitAssignment(contentId, studentId, file);
            return ResponseEntity.ok(submission);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/assignment/{contentId}")
    public ResponseEntity<List<Submission>> getSubmissionsByAssignment(@PathVariable Long contentId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByAssignment(contentId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Submission>> getSubmissionsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByStudent(studentId));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Submission>> getSubmissionsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByCourse(courseId));
    }

    @GetMapping("/{submissionId}")
    public ResponseEntity<?> getSubmissionById(@PathVariable Long submissionId) {
        Optional<Submission> submission = submissionService.getSubmissionById(submissionId);
        return submission.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/ungraded")
    public ResponseEntity<List<Submission>> getUngradedSubmissions() {
        return ResponseEntity.ok(submissionService.getUngradedSubmissions());
    }

    @PutMapping("/{submissionId}/grade")
    public ResponseEntity<?> gradeSubmission(
            @PathVariable Long submissionId,
            @RequestBody Map<String, Object> gradeData,
            Authentication authentication) {
        
        try {
            Long instructorId = getUserIdFromAuth(authentication);
            Double grade = Double.valueOf(gradeData.get("grade").toString());
            String feedback = (String) gradeData.get("feedback");
            
            Submission submission = submissionService.gradeSubmission(submissionId, grade, feedback, instructorId);
            return ResponseEntity.ok(submission);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Long getUserIdFromAuth(Authentication authentication) {
        // Extract user ID from JWT token - placeholder implementation
        return 1L;
    }
}