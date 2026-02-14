import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Form, Spinner, Badge, ListGroup, Button, ButtonGroup } from 'react-bootstrap';
import { FaSearch, FaTimes, FaBook, FaClipboardList, FaGraduationCap, FaHistory, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextSupabase';
import { globalSearch, getSearchHistory, clearSearchHistory } from '../../services/searchService';
import { addRecentlyViewed } from '../../services/recentlyViewedService';
import './GlobalSearch.css';

/**
 * GlobalSearch Component
 * Modal with global search across all content types
 * Supports keyboard navigation and search history
 */
const GlobalSearch = ({ show, onHide }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchHistory, setSearchHistory] = useState([]);

    const { user } = useAuth();
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // Load search history on mount
    useEffect(() => {
        if (show) {
            setSearchHistory(getSearchHistory());
            // Focus input when modal opens
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            // Reset on close
            setQuery('');
            setResults(null);
            setSelectedIndex(0);
        }
    }, [show]);

    // Perform search with debounce
    const performSearch = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults(null);
            return;
        }

        setIsSearching(true);

        try {
            const filters = activeFilter !== 'all' ? { type: activeFilter } : {};
            const searchResults = await globalSearch(searchQuery, user, filters);
            setResults(searchResults);
            setSelectedIndex(0);
        } catch (error) {
            if (import.meta.env.DEV) console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    }, [user, activeFilter]);

    // Handle query change with debounce
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [query, performSearch]);

    // Flatten results for keyboard navigation
    const flatResults = results ? [
        ...(results.lessons || []),
        ...(results.assignments || []),
        ...(results.subjects || []),
        ...(results.users || [])
    ] : [];

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!flatResults.length && !searchHistory.length) return;

        const itemCount = query.length >= 2 ? flatResults.length : searchHistory.length;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % itemCount);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + itemCount) % itemCount);
                break;
            case 'Enter':
                e.preventDefault();
                if (query.length >= 2 && flatResults[selectedIndex]) {
                    handleResultClick(flatResults[selectedIndex]);
                } else if (query.length < 2 && searchHistory[selectedIndex]) {
                    setQuery(searchHistory[selectedIndex]);
                }
                break;
            case 'Escape':
                onHide();
                break;
            default:
                break;
        }
    };

    // Handle result click
    const handleResultClick = (item) => {
        // Track in recently viewed
        if (item.type === 'lesson') {
            addRecentlyViewed('lesson', {
                id: item.lesson_id,
                title: item.lesson_title,
                subtitle: item.class_subject?.subject_offering?.subject?.subject_name
            });
            navigate(`/student/lessons/${item.lesson_id}`);
        } else if (item.type === 'assignment') {
            addRecentlyViewed('assignment', {
                id: item.assessment_id,
                title: item.assessment_name
            });
            navigate(`/student/assignments/${item.assessment_id}/submit`);
        } else if (item.type === 'subject') {
            navigate(`/student/subjects/${item.class_subject_id}`);
        }

        onHide();
    };

    // Get icon for result type
    const getIcon = (type) => {
        switch (type) {
            case 'lesson':
                return <FaBook className="result-icon" />;
            case 'assignment':
                return <FaClipboardList className="result-icon" />;
            case 'subject':
                return <FaGraduationCap className="result-icon" />;
            default:
                return <FaSearch className="result-icon" />;
        }
    };

    // Get result title
    const getTitle = (item) => {
        if (item.type === 'lesson') return item.lesson_title;
        if (item.type === 'assignment') return item.assessment_name;
        if (item.type === 'subject') return item.subject_offering?.subject?.subject_name;
        return 'Untitled';
    };

    // Get result subtitle
    const getSubtitle = (item) => {
        if (item.type === 'lesson') {
            return item.class_subject?.subject_offering?.subject?.subject_name;
        }
        if (item.type === 'assignment') {
            return item.assessment_type || 'Assignment';
        }
        if (item.type === 'subject') {
            return item.subject_offering?.subject?.subject_code;
        }
        return '';
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            className="global-search-modal"
            centered
        >
            <Modal.Body className="p-0">
                <div className="search-header">
                    <div className="search-input-wrapper">
                        <FaSearch className="search-icon" aria-hidden="true" />
                        <Form.Control
                            ref={inputRef}
                            type="text"
                            placeholder="Search lessons, assignments, subjects..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="search-input"
                            aria-label="Search lessons, assignments, and subjects"
                            role="combobox"
                            aria-expanded={flatResults.length > 0}
                            aria-autocomplete="list"
                        />
                        {isSearching && <Spinner animation="border" size="sm" className="search-spinner" />}
                        {query && (
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => setQuery('')}
                                className="clear-button"
                                aria-label="Clear search"
                            >
                                <FaTimes aria-hidden="true" />
                            </Button>
                        )}
                    </div>

                    {/* Filters */}
                    <ButtonGroup className="filter-buttons">
                        <Button
                            variant={activeFilter === 'all' ? 'primary' : 'outline-secondary'}
                            size="sm"
                            onClick={() => setActiveFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={activeFilter === 'lessons' ? 'primary' : 'outline-secondary'}
                            size="sm"
                            onClick={() => setActiveFilter('lessons')}
                        >
                            Lessons
                        </Button>
                        <Button
                            variant={activeFilter === 'assignments' ? 'primary' : 'outline-secondary'}
                            size="sm"
                            onClick={() => setActiveFilter('assignments')}
                        >
                            Assignments
                        </Button>
                        <Button
                            variant={activeFilter === 'subjects' ? 'primary' : 'outline-secondary'}
                            size="sm"
                            onClick={() => setActiveFilter('subjects')}
                        >
                            Subjects
                        </Button>
                    </ButtonGroup>
                </div>

                <div className="search-results">
                    {/* Search History */}
                    {query.length < 2 && searchHistory.length > 0 && (
                        <div className="search-section">
                            <div className="section-header">
                                <FaHistory className="me-2" />
                                <span>Recent Searches</span>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => {
                                        clearSearchHistory();
                                        setSearchHistory([]);
                                    }}
                                    className="ms-auto text-muted"
                                >
                                    Clear
                                </Button>
                            </div>
                            <ListGroup variant="flush">
                                {searchHistory.map((historyItem, index) => (
                                    <ListGroup.Item
                                        key={index}
                                        action
                                        active={selectedIndex === index}
                                        onClick={() => setQuery(historyItem)}
                                        className="search-result-item history-item"
                                    >
                                        <FaClock className="me-2 text-muted" />
                                        {historyItem}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </div>
                    )}

                    {/* Search Results */}
                    {query.length >= 2 && results && (
                        <>
                            {results.totalResults === 0 ? (
                                <div className="no-results">
                                    <FaSearch className="no-results-icon" />
                                    <p>No results found for "{query}"</p>
                                    <small className="text-muted">Try a different search term</small>
                                </div>
                            ) : (
                                <>
                                    {/* Lessons */}
                                    {results.lessons.length > 0 && (activeFilter === 'all' || activeFilter === 'lessons') && (
                                        <div className="search-section">
                                            <div className="section-header">
                                                <FaBook className="me-2" />
                                                Lessons ({results.lessons.length})
                                            </div>
                                            <ListGroup variant="flush">
                                                {results.lessons.map((item, index) => (
                                                    <ListGroup.Item
                                                        key={`lesson-${item.lesson_id}`}
                                                        action
                                                        active={flatResults.indexOf(item) === selectedIndex}
                                                        onClick={() => handleResultClick(item)}
                                                        className="search-result-item"
                                                    >
                                                        <div className="result-content">
                                                            {getIcon(item.type)}
                                                            <div className="result-text">
                                                                <div className="result-title">{getTitle(item)}</div>
                                                                <div className="result-subtitle">{getSubtitle(item)}</div>
                                                            </div>
                                                            <Badge bg="primary" className="result-badge">Lesson</Badge>
                                                        </div>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </div>
                                    )}

                                    {/* Assignments */}
                                    {results.assignments.length > 0 && (activeFilter === 'all' || activeFilter === 'assignments') && (
                                        <div className="search-section">
                                            <div className="section-header">
                                                <FaClipboardList className="me-2" />
                                                Assignments ({results.assignments.length})
                                            </div>
                                            <ListGroup variant="flush">
                                                {results.assignments.map((item) => (
                                                    <ListGroup.Item
                                                        key={`assignment-${item.assessment_id}`}
                                                        action
                                                        active={flatResults.indexOf(item) === selectedIndex}
                                                        onClick={() => handleResultClick(item)}
                                                        className="search-result-item"
                                                    >
                                                        <div className="result-content">
                                                            {getIcon(item.type)}
                                                            <div className="result-text">
                                                                <div className="result-title">{getTitle(item)}</div>
                                                                <div className="result-subtitle">{getSubtitle(item)}</div>
                                                            </div>
                                                            <Badge bg="success" className="result-badge">Assignment</Badge>
                                                        </div>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </div>
                                    )}

                                    {/* Subjects */}
                                    {results.subjects.length > 0 && (activeFilter === 'all' || activeFilter === 'subjects') && (
                                        <div className="search-section">
                                            <div className="section-header">
                                                <FaGraduationCap className="me-2" />
                                                Subjects ({results.subjects.length})
                                            </div>
                                            <ListGroup variant="flush">
                                                {results.subjects.map((item) => (
                                                    <ListGroup.Item
                                                        key={`subject-${item.class_subject_id}`}
                                                        action
                                                        active={flatResults.indexOf(item) === selectedIndex}
                                                        onClick={() => handleResultClick(item)}
                                                        className="search-result-item"
                                                    >
                                                        <div className="result-content">
                                                            {getIcon(item.type)}
                                                            <div className="result-text">
                                                                <div className="result-title">{getTitle(item)}</div>
                                                                <div className="result-subtitle">{getSubtitle(item)}</div>
                                                            </div>
                                                            <Badge bg="warning" className="result-badge">Subject</Badge>
                                                        </div>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* Loading state */}
                    {isSearching && query.length >= 2 && (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted">Searching...</p>
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div className="search-footer">
                    <small className="text-muted">
                        Use ↑↓ to navigate • Enter to select • Esc to close
                    </small>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default GlobalSearch;
