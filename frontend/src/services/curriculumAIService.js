/**
 * Curriculum AI Service
 * Handles AI generation for curriculum components (units, activities, resources, differentiation)
 */

import { searchEducationalVideos } from './youtubeService';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Generic function to call OpenAI API
 */
const callOpenAI = async (systemPrompt, userPrompt, temperature = 0.7) => {
    if (!API_KEY) {
        throw new Error('OpenAI API key is not configured.');
    }

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: temperature,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        // Try to parse JSON if expected
        try {
            // Find JSON object in content (in case of markdown wrapping)
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(content);
        } catch (e) {
            console.warn('Failed to parse JSON from AI response, returning raw text', e);
            return content;
        }
    } catch (error) {
        console.error('AI Service Error:', error);
        throw error;
    }
};

/**
 * Generate instructional units for a topic
 */
export const generateUnits = async (topicTitle, subject, gradeLevel, overview) => {
    const systemPrompt = `You are an expert curriculum developer. Generate a list of instructional units for a topic. 
  Respond with a JSON object containing an array "units". 
  Each unit should have: "title", "scoNumber" (e.g. "1.1"), "specificCurriculumOutcomes" (string), "duration" (string).`;

    const userPrompt = `Topic: ${topicTitle}
  Subject: ${subject}
  Grade Level: ${gradeLevel}
  Overview: ${overview || 'N/A'}
  
  Generate 3-5 comprehensive instructional units that cover this topic effectively.`;

    return callOpenAI(systemPrompt, userPrompt);
};

/**
 * Generate activities for a unit or set of outcomes
 */
export const generateActivities = async (outcomes, gradeLevel, subject) => {
    const systemPrompt = `You are an expert teacher. Generate engaging classroom activities based on learning outcomes.
  Respond with a JSON object containing an array "activities".
  Each activity should have: "description", "duration", "materials" (array of strings), "learningObjectives" (array of strings).`;

    const userPrompt = `Subject: ${subject}
  Grade Level: ${gradeLevel}
  Learning Outcomes: ${outcomes}
  
  Generate 3 distinct, hands-on classroom activities that help students achieve these outcomes.`;

    return callOpenAI(systemPrompt, userPrompt);
};

/**
 * Generate differentiation strategies (Inclusive Learning)
 */
export const generateDifferentiation = async (unitContext, studentNeeds) => {
    const systemPrompt = `You are a special education specialist. Suggest inclusive learning strategies.
  Respond with a JSON object containing an array "strategies".
  Each strategy should have: "title", "description", "targetGroup" (e.g. "Visual Learners", "ADHD").`;

    const userPrompt = `Context: ${unitContext}
  Specific Student Needs: ${studentNeeds || 'General inclusion for visual, auditory, and kinesthetic learners'}
  
  Suggest 3-4 specific differentiation strategies for this context.`;

    return callOpenAI(systemPrompt, userPrompt);
};

/**
 * Find resources (Videos and Games)
 * Combines YouTube search with AI suggestions for other types
 */
export const findResources = async (query, subject, gradeLevel) => {
    const resources = [];

    // 1. Search YouTube
    try {
        const videos = await searchEducationalVideos({
            query: `${query} ${subject} educational`,
            subject,
            form: gradeLevel,
            maxResults: 3
        });

        videos.forEach(v => {
            resources.push({
                type: 'VIDEO',
                data: {
                    title: v.title,
                    url: v.url,
                    description: v.description,
                    thumbnail: v.thumbnail
                },
                confidence: 0.9
            });
        });
    } catch (e) {
        console.error('YouTube search failed:', e);
    }

    // 2. AI Suggestions for Games/Websites
    try {
        const systemPrompt = `You are an educational technologist. Recommend high-quality, free educational websites or games.
    Respond with a JSON object containing an array "resources".
    Each resource should have: "title", "url", "type" (GAME or WEBSITE), "description".`;

        const userPrompt = `Topic: ${query}
    Subject: ${subject}
    Grade Level: ${gradeLevel}
    
    Recommend 2-3 specific, real, and accessible educational websites or games for this topic.`;

        const aiResponse = await callOpenAI(systemPrompt, userPrompt);
        if (aiResponse && aiResponse.resources) {
            aiResponse.resources.forEach(r => {
                resources.push({
                    type: 'RESOURCE', // Generic resource type for games/websites
                    data: {
                        title: r.title,
                        url: r.url,
                        type: r.type, // Subtype
                        description: r.description
                    },
                    confidence: 0.8
                });
            });
        }
    } catch (e) {
        console.error('AI resource suggestion failed:', e);
    }

    return resources;
};

export default {
    generateUnits,
    generateActivities,
    generateDifferentiation,
    findResources
};
