import React, { useState, useEffect } from 'react';
import {
  Modal, Card, Button, Badge, Spinner, Alert, Form
} from 'react-bootstrap';
import {
  FaMagic, FaLightbulb, FaLink, FaGamepad, FaFileAlt, FaCheck, FaTimes
} from 'react-icons/fa';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContextSupabase';

function AISuggestionPanel({ show, onHide, context, offering, onApplySuggestion }) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (show && context) {
      loadSuggestions();
    }
  }, [show, context]);

  const loadSuggestions = async () => {
    if (!offering || !context) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('curriculum_ai_suggestions')
        .select('*')
        .eq('offering_id', offering.offering_id)
        .eq('context_type', context.type)
        .eq('context_path', context.path)
        .eq('used', false)
        .order('confidence_score', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    if (!context || !offering) return;

    setGenerating(true);
    try {
      // Call AI service to generate suggestions
      const aiSuggestions = await fetchAISuggestions(context, offering);

      // Save suggestions to database
      if (aiSuggestions.length > 0) {
        const suggestionsToInsert = aiSuggestions.map(s => ({
          offering_id: offering.offering_id,
          context_type: context.type,
          context_path: context.path,
          learning_outcome: s.learningOutcome || context.topic?.title,
          suggestion_type: s.type,
          suggestion_data: s.data,
          confidence_score: s.confidence || 0.8
        }));

        const { error } = await supabase
          .from('curriculum_ai_suggestions')
          .insert(suggestionsToInsert);

        if (error) throw error;
        await loadSuggestions();
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const fetchAISuggestions = async (context, offering) => {
    // This is a placeholder for AI integration
    // In production, this would call an AI service (OpenAI, Claude, etc.)
    // For now, we'll use rule-based suggestions

    const suggestions = [];

    // Rule-based suggestions based on context
    if (context.type === 'TOPIC' && context.topic) {
      const topic = context.topic;

      // Suggest activities based on topic title
      if (topic.title) {
        const titleLower = topic.title.toLowerCase();

        // Math topics
        if (titleLower.includes('number') || titleLower.includes('math')) {
          suggestions.push({
            type: 'ACTIVITY',
            data: {
              title: 'Number Line Activity',
              description: 'Interactive number line exercise for understanding number relationships',
              duration: '30 minutes',
              materials: ['Number line chart', 'Counters'],
              learningObjectives: ['Understand number relationships', 'Practice counting']
            },
            confidence: 0.9
          });

          suggestions.push({
            type: 'RESOURCE',
            data: {
              title: 'Khan Academy - Number Operations',
              url: 'https://www.khanacademy.org/math/arithmetic',
              type: 'VIDEO',
              description: 'Comprehensive video series on number operations'
            },
            confidence: 0.85
          });
        }

        // Science topics
        if (titleLower.includes('science') || titleLower.includes('experiment')) {
          suggestions.push({
            type: 'ACTIVITY',
            data: {
              title: 'Hands-on Experiment',
              description: 'Practical experiment to reinforce scientific concepts',
              duration: '45 minutes',
              materials: ['Lab equipment', 'Safety materials'],
              learningObjectives: ['Apply scientific method', 'Observe and record data']
            },
            confidence: 0.9
          });
        }

        // Language topics
        if (titleLower.includes('language') || titleLower.includes('reading') || titleLower.includes('writing')) {
          suggestions.push({
            type: 'ACTIVITY',
            data: {
              title: 'Reading Comprehension Exercise',
              description: 'Engage students with reading and comprehension activities',
              duration: '40 minutes',
              materials: ['Reading materials', 'Question sheets'],
              learningObjectives: ['Improve reading comprehension', 'Develop critical thinking']
            },
            confidence: 0.85
          });
        }
      }

      // Suggest resources based on learning outcomes
      if (topic.essentialLearningOutcomes && topic.essentialLearningOutcomes.length > 0) {
        suggestions.push({
          type: 'RESOURCE',
          data: {
            title: 'Interactive Learning Games',
            url: 'https://www.education.com/games',
            type: 'GAME',
            description: 'Educational games aligned with learning outcomes'
          },
          confidence: 0.75
        });
      }
    }

    // Suggest assessment strategies
    if (context.type === 'UNIT' || context.type === 'SCO') {
      suggestions.push({
        type: 'ASSESSMENT',
        data: {
          title: 'Formative Assessment Quiz',
          description: 'Quick quiz to check understanding',
          questionCount: 5,
          timeLimit: 15
        },
        confidence: 0.8
      });
    }

    return suggestions;
  };

  const handleApplySuggestion = async (suggestion) => {
    try {
      // Mark suggestion as used
      await supabase
        .from('curriculum_ai_suggestions')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('suggestion_id', suggestion.suggestion_id);

      if (onApplySuggestion) {
        onApplySuggestion(suggestion);
      }

      // Remove from list
      setSuggestions(suggestions.filter(s => s.suggestion_id !== suggestion.suggestion_id));
    } catch (error) {
      console.error('Error applying suggestion:', error);
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'ACTIVITY': return <FaLightbulb />;
      case 'RESOURCE': return <FaLink />;
      case 'ASSESSMENT': return <FaFileAlt />;
      default: return <FaMagic />;
    }
  };

  if (!context) {
    return (
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMagic className="me-2" />
            AI Suggestions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Select a topic, unit, or SCO to get AI-powered suggestions.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaMagic className="me-2" />
          AI Suggestions
          {context.topic && (
            <Badge bg="info" className="ms-2">
              {context.topic.title || 'Topic'}
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <Button
            variant="primary"
            onClick={generateSuggestions}
            disabled={generating}
          >
            {generating ? (
              <>
                <Spinner size="sm" className="me-2" />
                Generating...
              </>
            ) : (
              <>
                <FaMagic className="me-2" />
                Generate New Suggestions
              </>
            )}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : suggestions.length === 0 ? (
          <Alert variant="info">
            No suggestions available. Click "Generate New Suggestions" to get AI-powered recommendations.
          </Alert>
        ) : (
          <div className="suggestions-list">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.suggestion_id} className="mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      {getSuggestionIcon(suggestion.suggestion_type)}
                      <strong>{suggestion.suggestion_data?.title || 'Suggestion'}</strong>
                      {suggestion.confidence_score && (
                        <Badge bg={
                          suggestion.confidence_score > 0.8 ? 'success' :
                          suggestion.confidence_score > 0.6 ? 'warning' : 'secondary'
                        }>
                          {Math.round(suggestion.confidence_score * 100)}% match
                        </Badge>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApplySuggestion(suggestion)}
                      >
                        <FaCheck className="me-1" />
                        Apply
                      </Button>
                    </div>
                  </div>
                  {suggestion.suggestion_data?.description && (
                    <p className="text-muted mb-2">{suggestion.suggestion_data.description}</p>
                  )}
                  {suggestion.suggestion_type === 'ACTIVITY' && suggestion.suggestion_data && (
                    <div className="activity-details">
                      {suggestion.suggestion_data.duration && (
                        <Badge bg="info" className="me-2">
                          Duration: {suggestion.suggestion_data.duration}
                        </Badge>
                      )}
                      {suggestion.suggestion_data.materials && (
                        <div className="mt-2">
                          <strong>Materials:</strong> {suggestion.suggestion_data.materials.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                  {suggestion.suggestion_type === 'RESOURCE' && suggestion.suggestion_data?.url && (
                    <div>
                      <a
                        href={suggestion.suggestion_data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        <FaLink className="me-1" />
                        View Resource
                      </a>
                    </div>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AISuggestionPanel;

