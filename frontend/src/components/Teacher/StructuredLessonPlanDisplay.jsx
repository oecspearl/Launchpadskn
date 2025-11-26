import React, { useState } from 'react';
import { Card, Accordion, Badge } from 'react-bootstrap';
import {
    FaBullseye, FaListOl, FaLightbulb, FaCheckCircle,
    FaClock, FaChalkboardTeacher, FaUsers, FaComments,
    FaBook, FaClipboardCheck, FaLink, FaQuestionCircle,
    FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import './StructuredLessonPlanDisplay.css';

function StructuredLessonPlanDisplay({ lessonPlanText }) {
    const [expandedSections, setExpandedSections] = useState({});

    // Parse the lesson plan text into structured sections
    const parseLessonPlan = (text) => {
        if (!text) return null;

        const sections = [];
        const lines = text.split('\n');
        let currentSection = null;
        let currentComponent = null;

        lines.forEach((line) => {
            const trimmed = line.trim();

            // Main section headers (with ═══)
            if (line.includes('═══════════')) {
                return; // Skip separator lines
            }

            // Section titles (LESSON COMPONENTS, ASSESSMENT, etc.)
            if (trimmed && trimmed === trimmed.toUpperCase() && trimmed.length < 50 && !trimmed.includes(':')) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                currentSection = {
                    title: trimmed,
                    components: [],
                    content: []
                };
                currentComponent = null;
                return;
            }

            // Component headers (Prompter/Hook:, Introduction:, etc.)
            if (trimmed.endsWith(':') && !trimmed.startsWith('⏱️') && !trimmed.startsWith('📝') &&
                !trimmed.startsWith('👨‍🏫') && !trimmed.startsWith('💬') && !trimmed.startsWith('📚')) {
                if (currentComponent && currentSection) {
                    currentSection.components.push(currentComponent);
                }
                currentComponent = {
                    title: trimmed.slice(0, -1),
                    details: []
                };
                return;
            }

            // Detail lines (with emojis)
            if (trimmed && currentComponent) {
                currentComponent.details.push(trimmed);
            } else if (trimmed && currentSection && !currentComponent) {
                currentSection.content.push(trimmed);
            }
        });

        // Push last component and section
        if (currentComponent && currentSection) {
            currentSection.components.push(currentComponent);
        }
        if (currentSection) {
            sections.push(currentSection);
        }

        return sections;
    };

    const getSectionIcon = (title) => {
        const lower = title.toLowerCase();
        if (lower.includes('objective')) return FaBullseye;
        if (lower.includes('component')) return FaListOl;
        if (lower.includes('assessment')) return FaCheckCircle;
        if (lower.includes('resource')) return FaBook;
        if (lower.includes('header')) return FaChalkboardTeacher;
        return FaLightbulb;
    };

    const getComponentIcon = (title) => {
        const lower = title.toLowerCase();
        if (lower.includes('prompter') || lower.includes('hook')) return FaLightbulb;
        if (lower.includes('introduction')) return FaChalkboardTeacher;
        if (lower.includes('development') || lower.includes('practice')) return FaUsers;
        if (lower.includes('reflect') || lower.includes('share')) return FaComments;
        if (lower.includes('closure')) return FaCheckCircle;
        return FaListOl;
    };

    const getDetailIcon = (text) => {
        if (text.startsWith('⏱️')) return FaClock;
        if (text.startsWith('📝')) return FaBook;
        if (text.startsWith('👨‍🏫')) return FaChalkboardTeacher;
        if (text.startsWith('💬')) return FaComments;
        if (text.startsWith('📚')) return FaBook;
        if (text.startsWith('✋')) return FaUsers;
        if (text.startsWith('💭')) return FaQuestionCircle;
        if (text.startsWith('🔗')) return FaLink;
        if (text.startsWith('✅')) return FaCheckCircle;
        return null;
    };

    const cleanDetailText = (text) => {
        // Remove emoji and label, keep the content
        return text.replace(/^[⏱️📝👨‍🏫💬📚✋💭🔗✅📊🛠️🤔🔄📖⚠️🎯❓]\s*[A-Z\s/]+:\s*/i, '');
    };

    const getDetailLabel = (text) => {
        const match = text.match(/^[⏱️📝👨‍🏫💬📚✋💭🔗✅📊🛠️🤔🔄📖⚠️🎯❓]\s*([A-Z\s/]+):/i);
        return match ? match[1] : null;
    };

    const toggleSection = (sectionIndex) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionIndex]: !prev[sectionIndex]
        }));
    };

    const sections = parseLessonPlan(lessonPlanText);

    if (!sections || sections.length === 0) {
        return (
            <div className="structured-lesson-plan">
                <div className="lesson-plan-content">
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {lessonPlanText}
                    </pre>
                </div>
            </div>
        );
    }

    return (
        <div className="structured-lesson-plan">
            {sections.map((section, sectionIndex) => {
                const SectionIcon = getSectionIcon(section.title);
                const isExpanded = expandedSections[sectionIndex] !== false; // Default to expanded

                return (
                    <Card key={sectionIndex} className="lesson-section-card mb-3">
                        <Card.Header
                            className="lesson-section-header"
                            onClick={() => toggleSection(sectionIndex)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="section-icon-wrapper">
                                        <SectionIcon />
                                    </div>
                                    <h4 className="section-title mb-0">{section.title}</h4>
                                    {section.components.length > 0 && (
                                        <Badge bg="secondary">{section.components.length} items</Badge>
                                    )}
                                </div>
                                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                            </div>
                        </Card.Header>

                        {isExpanded && (
                            <Card.Body className="lesson-section-body">
                                {/* Section content (non-component text) */}
                                {section.content.length > 0 && (
                                    <div className="section-content mb-3">
                                        {section.content.map((line, idx) => (
                                            <p key={idx} className="content-line">{line}</p>
                                        ))}
                                    </div>
                                )}

                                {/* Components */}
                                {section.components.map((component, compIndex) => {
                                    const ComponentIcon = getComponentIcon(component.title);

                                    return (
                                        <div key={compIndex} className="lesson-component-card mb-3">
                                            <div className="component-header">
                                                <div className="component-icon-wrapper">
                                                    <ComponentIcon />
                                                </div>
                                                <h5 className="component-title">{component.title}</h5>
                                            </div>

                                            <div className="component-details">
                                                {component.details.map((detail, detailIndex) => {
                                                    const label = getDetailLabel(detail);
                                                    const cleanText = cleanDetailText(detail);
                                                    const DetailIcon = getDetailIcon(detail);

                                                    if (label) {
                                                        // Determine color theme based on label type
                                                        const labelUpper = label.toUpperCase();
                                                        let themeClass = '';
                                                        if (labelUpper.includes('TIMING')) {
                                                            themeClass = 'detail-item-timing';
                                                        } else if (labelUpper.includes('TEACHER INSTRUCTIONS') || labelUpper.includes('TEACHER DIALOGUE')) {
                                                            themeClass = 'detail-item-teacher';
                                                        } else if (labelUpper.includes('STUDENT')) {
                                                            themeClass = 'detail-item-student';
                                                        } else if (labelUpper.includes('ASSESSMENT') || labelUpper.includes('CHECKPOINT')) {
                                                            themeClass = 'detail-item-assessment';
                                                        }

                                                        return (
                                                            <div key={detailIndex} className={`detail-item ${themeClass}`}>
                                                                <div className="detail-label">
                                                                    {DetailIcon && <DetailIcon className="detail-icon" />}
                                                                    <strong>{label}:</strong>
                                                                </div>
                                                                <div className="detail-content">
                                                                    {cleanText}
                                                                </div>
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <div key={detailIndex} className="detail-simple">
                                                                {detail}
                                                            </div>
                                                        );
                                                    }
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </Card.Body>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}

export default StructuredLessonPlanDisplay;
