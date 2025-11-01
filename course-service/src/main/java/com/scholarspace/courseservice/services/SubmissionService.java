package com.scholarspace.courseservice.services;

import com.scholarspace.courseservice.models.CourseContent;
import com.scholarspace.courseservice.models.Submission;
import com.scholarspace.courseservice.repositories.CourseContentRepository;
import com.scholarspace.courseservice.repositories.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final CourseContentRepository courseContentRepository;
    private final EnrollmentService enrollmentService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public Submission submitAssignment(Long contentId, Long studentId, MultipartFile file) {
        CourseContent assignment = courseContentRepository.findById(contentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        // Validate student is enrolled in the course
        List<com.scholarspace.courseservice.models.Enrollment> enrollments = 
                enrollmentService.getActiveEnrollmentsByStudent(studentId);
        
        boolean isEnrolled = enrollments.stream()
                .anyMatch(e -> e.getCourse().getId().equals(assignment.getCourse().getId()));
        
        if (!isEnrolled) {
            throw new RuntimeException("Student is not enrolled in this course");
        }

        // Check if submission already exists
        Optional<Submission> existing = submissionRepository
                .findByAssignment_ContentIdAndStudentId(contentId, studentId);
        if (existing.isPresent()) {
            throw new RuntimeException("Assignment already submitted");
        }

        String filePath = null;
        if (file != null && !file.isEmpty()) {
            filePath = saveSubmissionFile(file, assignment.getCourse().getId(), studentId);
        }

        Submission submission = new Submission(assignment, studentId, filePath);
        return submissionRepository.save(submission);
    }

    private String saveSubmissionFile(MultipartFile file, Long courseId, Long studentId) {
        try {
            Path submissionDir = Paths.get(uploadDir, "submissions", courseId.toString());
            Files.createDirectories(submissionDir);

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                    : "";
            String uniqueFilename = studentId + "_" + UUID.randomUUID().toString() + extension;

            Path filePath = submissionDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath);

            return filePath.toString();
        } catch (IOException e) {
            log.error("Failed to save submission file", e);
            throw new RuntimeException("Failed to save submission file: " + e.getMessage());
        }
    }

    public List<Submission> getSubmissionsByAssignment(Long contentId) {
        return submissionRepository.findByAssignment_ContentId(contentId);
    }

    public List<Submission> getSubmissionsByStudent(Long studentId) {
        return submissionRepository.findByStudentId(studentId);
    }

    public List<Submission> getSubmissionsByCourse(Long courseId) {
        return submissionRepository.findByAssignment_Course_Id(courseId);
    }

    public Submission gradeSubmission(Long submissionId, Double grade, String feedback, Long instructorId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        submission.setGrade(grade);
        submission.setFeedback(feedback);
        submission.setGradedBy(instructorId);
        submission.setGradedAt(LocalDateTime.now());

        return submissionRepository.save(submission);
    }

    public Optional<Submission> getSubmissionById(Long submissionId) {
        return submissionRepository.findById(submissionId);
    }

    public List<Submission> getUngradedSubmissions() {
        return submissionRepository.findByGradedByIsNull();
    }
}