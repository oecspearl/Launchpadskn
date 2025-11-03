package com.scholarspace.courseservice.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scholarspace.courseservice.models.dto.LessonGenerationRequest;
import com.scholarspace.courseservice.models.dto.LessonGenerationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class OpenAIService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${app.openai.api-key:${OPENAI_API_KEY:}}")
    private String openaiApiKey;
    
    @Value("${app.openai.api-url:https://api.openai.com/v1/chat/completions}")
    private String openaiApiUrl;
    
    @Value("${app.openai.model:gpt-4o-mini}")
    private String openaiModel;

    public OpenAIService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }

    public LessonGenerationResponse generateLesson(LessonGenerationRequest request) {
        try {
            String curriculumContext = formatCurriculumContext(request.getCurriculumData());
            String prompt = buildPrompt(curriculumContext, request);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", openaiModel);
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 2000);
            
            List<Map<String, String>> messages = List.of(
                Map.of("role", "system", 
                    "content", "You are an expert educational content creator. Generate lesson plans that align with curriculum standards and are practical for classroom implementation. Always respond with valid JSON only."),
                Map.of("role", "user", "content", prompt)
            );
            requestBody.put("messages", messages);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("Authorization", "Bearer " + openaiApiKey);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                openaiApiUrl,
                HttpMethod.POST,
                entity,
                Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                    String content = (String) message.get("content");
                    
                    return parseGeneratedContent(content);
                }
            }
            
            throw new RuntimeException("Failed to generate lesson from OpenAI");
            
        } catch (Exception e) {
            log.error("Error generating lesson with OpenAI", e);
            throw new RuntimeException("Failed to generate lesson: " + e.getMessage(), e);
        }
    }

    private String formatCurriculumContext(Map<String, Object> curriculumData) {
        if (curriculumData == null) return "";
        
        StringBuilder context = new StringBuilder();
        
        // Add subject information
        Map<String, Object> subject = (Map<String, Object>) curriculumData.get("subject");
        if (subject != null) {
            context.append("Subject: ").append(subject.get("subject_name")).append("\n");
            if (subject.get("description") != null) {
                context.append("Subject Description: ").append(subject.get("description")).append("\n");
            }
        }
        
        // Add form information
        Map<String, Object> form = (Map<String, Object>) curriculumData.get("form");
        if (form != null) {
            context.append("Form/Grade Level: ").append(form.get("form_name")).append("\n");
        }
        
        // Add basic curriculum fields
        if (curriculumData.get("curriculum_framework") != null) {
            context.append("\nCurriculum Framework:\n").append(curriculumData.get("curriculum_framework")).append("\n");
        }
        
        if (curriculumData.get("learning_outcomes") != null) {
            context.append("\nLearning Outcomes:\n").append(curriculumData.get("learning_outcomes")).append("\n");
        }
        
        // Add structured curriculum if available
        Map<String, Object> structure = (Map<String, Object>) curriculumData.get("curriculum_structure");
        if (structure != null) {
            Map<String, Object> frontMatter = (Map<String, Object>) structure.get("frontMatter");
            if (frontMatter != null && frontMatter.get("introduction") != null) {
                context.append("\nCurriculum Introduction:\n").append(frontMatter.get("introduction")).append("\n");
            }
            
            List<Map<String, Object>> topics = (List<Map<String, Object>>) structure.get("topics");
            if (topics != null) {
                context.append("\nCurriculum Topics:\n");
                for (int i = 0; i < topics.size(); i++) {
                    Map<String, Object> topic = topics.get(i);
                    Integer topicNumber = (Integer) topic.getOrDefault("topicNumber", i + 1);
                    String title = (String) topic.getOrDefault("title", "Untitled Topic");
                    context.append("\nTopic ").append(topicNumber).append(": ").append(title).append("\n");
                    
                    Map<String, Object> overview = (Map<String, Object>) topic.get("overview");
                    if (overview != null) {
                        if (overview.get("strandIdentification") != null) {
                            context.append("  Strand: ").append(overview.get("strandIdentification")).append("\n");
                        }
                        List<String> outcomes = (List<String>) overview.get("essentialLearningOutcomes");
                        if (outcomes != null) {
                            context.append("  Essential Learning Outcomes:\n");
                            for (String outcome : outcomes) {
                                context.append("    - ").append(outcome).append("\n");
                            }
                        }
                    }
                    
                    List<Map<String, Object>> units = (List<Map<String, Object>>) topic.get("instructionalUnits");
                    if (units != null) {
                        context.append("  Instructional Units:\n");
                        for (int j = 0; j < units.size(); j++) {
                            Map<String, Object> unit = units.get(j);
                            Integer unitNumber = (Integer) unit.getOrDefault("unitNumber", j + 1);
                            context.append("    Unit ").append(unitNumber).append(":\n");
                            if (unit.get("specificCurriculumOutcomes") != null) {
                                context.append("      Specific Curriculum Outcome: ").append(unit.get("specificCurriculumOutcomes")).append("\n");
                            }
                            if (unit.get("inclusiveAssessmentStrategies") != null) {
                                context.append("      Assessment Strategy: ").append(unit.get("inclusiveAssessmentStrategies")).append("\n");
                            }
                            if (unit.get("inclusiveLearningStrategies") != null) {
                                context.append("      Learning Strategy: ").append(unit.get("inclusiveLearningStrategies")).append("\n");
                            }
                        }
                    }
                }
            }
        }
        
        return context.toString();
    }

    private String buildPrompt(String curriculumContext, LessonGenerationRequest request) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are an expert educational content creator. Generate a comprehensive lesson plan based on the following curriculum information.\n\n");
        prompt.append("CURRICULUM INFORMATION:\n").append(curriculumContext).append("\n\n");
        
        if (request.getTopic() != null && !request.getTopic().isEmpty()) {
            prompt.append("SPECIFIC TOPIC REQUESTED: ").append(request.getTopic()).append("\n\n");
        }
        
        String subjectName = "the subject";
        String formName = "";
        if (request.getCurriculumData() != null) {
            Map<String, Object> subject = (Map<String, Object>) request.getCurriculumData().get("subject");
            if (subject != null && subject.get("subject_name") != null) {
                subjectName = (String) subject.get("subject_name");
            }
            Map<String, Object> form = (Map<String, Object>) request.getCurriculumData().get("form");
            if (form != null && form.get("form_name") != null) {
                formName = (String) form.get("form_name") + " ";
            }
        }
        
        int duration = request.getDuration() != null ? request.getDuration() : 45;
        
        prompt.append("Please generate a complete lesson plan that:\n");
        prompt.append("1. Aligns with the curriculum framework and learning outcomes provided above\n");
        prompt.append("2. Is appropriate for ").append(formName).append(subjectName).append("\n");
        prompt.append("3. Includes a clear lesson title\n");
        prompt.append("4. Specifies the topic being covered\n");
        prompt.append("5. Lists clear, measurable learning objectives (3-5 objectives)\n");
        prompt.append("6. Provides a detailed lesson plan with activities, teaching strategies, and assessment methods\n");
        prompt.append("7. Is suitable for a ").append(duration).append("-minute class period\n");
        prompt.append("8. Incorporates inclusive teaching strategies and assessment methods from the curriculum\n\n");
        
        prompt.append("Format your response as a JSON object with the following structure:\n");
        prompt.append("{\n");
        prompt.append("  \"lesson_title\": \"A clear, descriptive title for the lesson\",\n");
        prompt.append("  \"topic\": \"The specific topic being covered\",\n");
        prompt.append("  \"learning_objectives\": \"A numbered list of 3-5 clear learning objectives. Each objective should be specific, measurable, and aligned with the curriculum outcomes.\",\n");
        prompt.append("  \"lesson_plan\": \"A detailed lesson plan that includes:\\n- Introduction/Warm-up activities\\n- Main teaching content and activities\\n- Student engagement strategies\\n- Assessment methods\\n- Summary and conclusion\\n- Any homework or follow-up activities\"\n");
        prompt.append("}\n\n");
        prompt.append("IMPORTANT: Return ONLY valid JSON, no additional text before or after.");
        
        return prompt.toString();
    }

    private LessonGenerationResponse parseGeneratedContent(String content) {
        try {
            // Try to extract JSON from the response
            String jsonContent = content.trim();
            if (jsonContent.startsWith("```json")) {
                jsonContent = jsonContent.substring(7);
            }
            if (jsonContent.startsWith("```")) {
                jsonContent = jsonContent.substring(3);
            }
            if (jsonContent.endsWith("```")) {
                jsonContent = jsonContent.substring(0, jsonContent.length() - 3);
            }
            jsonContent = jsonContent.trim();
            
            // Find JSON object
            int startIdx = jsonContent.indexOf('{');
            int endIdx = jsonContent.lastIndexOf('}');
            if (startIdx >= 0 && endIdx > startIdx) {
                jsonContent = jsonContent.substring(startIdx, endIdx + 1);
            }
            
            JsonNode jsonNode = objectMapper.readTree(jsonContent);
            
            return new LessonGenerationResponse(
                jsonNode.has("lesson_title") ? jsonNode.get("lesson_title").asText() : "",
                jsonNode.has("topic") ? jsonNode.get("topic").asText() : "",
                jsonNode.has("learning_objectives") ? jsonNode.get("learning_objectives").asText() : "",
                jsonNode.has("lesson_plan") ? jsonNode.get("lesson_plan").asText() : ""
            );
        } catch (Exception e) {
            log.error("Failed to parse OpenAI response", e);
            throw new RuntimeException("Failed to parse lesson plan response: " + e.getMessage(), e);
        }
    }
}

