package com.scholarspace.courseservice.models.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LessonGenerationRequest {
    private Map<String, Object> curriculumData;
    private String topic;
    private String lessonDate;
    private Integer duration;
    private Map<String, Object> teacherPreferences;
}

