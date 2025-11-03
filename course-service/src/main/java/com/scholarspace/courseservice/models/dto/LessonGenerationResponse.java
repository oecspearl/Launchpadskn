package com.scholarspace.courseservice.models.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LessonGenerationResponse {
    private String lessonTitle;
    private String topic;
    private String learningObjectives;
    private String lessonPlan;
}

