import React, { useState } from 'react';
import { Form, Dropdown } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getSearchSuggestions } from '../../services/searchService';
import './QuickSearch.css';

/**
 * QuickSearch Component
 * Compact search input in navbar with suggestions dropdown
 * Opens GlobalSearch modal for detailed search
 */
const QuickSearch = ({ onOpenGlobalSearch }) => {
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        if (value.length >= 2) {
            const sug = getSearchSuggestions(value);
            setSuggestions(sug);
            setShowSuggestions(sug.length > 0);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleFocus = () => {
        // Open global search modal
        if (onOpenGlobalSearch) {
            onOpenGlobalSearch();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
        setShowSuggestions(false);
        if (onOpenGlobalSearch) {
            onOpenGlobalSearch(suggestion);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            if (onOpenGlobalSearch) {
                onOpenGlobalSearch(query);
            }
        }
    };

    return (
        <div className="quick-search-wrapper">
            <Form onSubmit={handleSubmit} className="quick-search-form">
                <div className="quick-search-input-group">
                    <FaSearch className="quick-search-icon" />
                    <Form.Control
                        type="text"
                        placeholder="Search... (Alt+S)"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={handleFocus}
                        className="quick-search-input"
                        autoComplete="off"
                    />
                </div>
            </Form>

            {showSuggestions && (
                <Dropdown.Menu show className="quick-search-dropdown">
                    {suggestions.map((suggestion, index) => (
                        <Dropdown.Item
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            <FaSearch className="me-2 text-muted" size={12} />
                            {suggestion}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            )}
        </div>
    );
};

export default QuickSearch;
