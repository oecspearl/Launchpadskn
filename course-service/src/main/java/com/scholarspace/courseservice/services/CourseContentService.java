package com.scholarspace.courseservice.services;

import com.scholarspace.courseservice.models.Course;
import com.scholarspace.courseservice.models.CourseContent;
import com.scholarspace.courseservice.models.ContentType;
import com.scholarspace.courseservice.repositories.CourseContentRepository;
import com.scholarspace.courseservice.repositories.CourseRepository;
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
public class CourseContentService {

    private final CourseContentRepository courseContentRepository;
    private final CourseRepository courseRepository;
    private final InstructorAssignmentService instructorAssignmentService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public CourseContent createCourseContent(Long courseId, String title, String description, 
                                           ContentType contentType, Long instructorId, 
                                           LocalDateTime dueDate, MultipartFile file) {
        
        // Validate instructor has access to course
        if (!instructorAssignmentService.isInstructorAssignedToCourse(instructorId, courseId)) {
            throw new RuntimeException("Instructor is not assigned to this course");
        }
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        CourseContent content = new CourseContent();
        content.setCourse(course);
        content.setTitle(title);
        content.setDescription(description);
        content.setContentType(contentType);
        content.setCreatedBy(instructorId);
        content.setDueDate(dueDate);
        content.setPublishedAt(LocalDateTime.now());
        
        // Handle file upload if provided
        if (file != null && !file.isEmpty()) {
            String filePath = saveFile(file, courseId);
            content.setFilePath(filePath);
            content.setFileType(file.getContentType());
        }
        
        return courseContentRepository.save(content);
    }

    private String saveFile(MultipartFile file, Long courseId) {
        try {
            // Create course-specific directory
            Path courseDir = Paths.get(uploadDir, "course-contents", courseId.toString());
            Files.createDirectories(courseDir);
            
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                    : "";
            String uniqueFilename = UUID.randomUUID().toString() + extension;
            
            Path filePath = courseDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath);
            
            return filePath.toString();
        } catch (IOException e) {
            log.error("Failed to save file", e);
            throw new RuntimeException("Failed to save file: " + e.getMessage());
        }
    }

    public List<CourseContent> getCourseContentsByCourse(Long courseId) {
        return courseContentRepository.findByCourse_IdOrderByCreatedAtDesc(courseId);
    }

    public List<CourseContent> getCourseContentsByType(Long courseId, ContentType contentType) {
        return courseContentRepository.findByCourse_IdAndContentType(courseId, contentType);
    }

    public Optional<CourseContent> getCourseContentById(Long contentId) {
        return courseContentRepository.findById(contentId);
    }

    public CourseContent updateCourseContent(Long contentId, String title, String description, 
                                           ContentType contentType, LocalDateTime dueDate, 
                                           Long instructorId) {
        
        CourseContent content = courseContentRepository.findById(contentId)
                .orElseThrow(() -> new RuntimeException("Course content not found"));
        
        // Validate instructor has access to course
        if (!instructorAssignmentService.isInstructorAssignedToCourse(instructorId, content.getCourse().getId())) {
            throw new RuntimeException("Instructor is not assigned to this course");
        }
        
        if (title != null) content.setTitle(title);
        if (description != null) content.setDescription(description);
        if (contentType != null) content.setContentType(contentType);
        if (dueDate != null) content.setDueDate(dueDate);
        
        return courseContentRepository.save(content);
    }

    public void deleteCourseContent(Long contentId, Long instructorId) {
        CourseContent content = courseContentRepository.findById(contentId)
                .orElseThrow(() -> new RuntimeException("Course content not found"));
        
        // Validate instructor has access to course
        if (!instructorAssignmentService.isInstructorAssignedToCourse(instructorId, content.getCourse().getId())) {
            throw new RuntimeException("Instructor is not assigned to this course");
        }
        
        // Delete file if exists
        if (content.getFilePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(content.getFilePath()));
            } catch (IOException e) {
                log.warn("Failed to delete file: {}", content.getFilePath(), e);
            }
        }
        
        courseContentRepository.delete(content);
    }
}