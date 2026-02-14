import React from 'react';
import { Link } from 'react-router-dom';
import { FaBook, FaCalculator, FaGlobe, FaArrowRight } from 'react-icons/fa';
import './CurriculumAccess.css';

const CurriculumAccess = () => {
    const curriculumPages = [
        {
            id: 'math-form1',
            title: 'Mathematics',
            subtitle: 'Form 1',
            description: 'Enhanced Mathematics curriculum for Form 1 students',
            path: '/curriculum/skn-mathematics',
            icon: <FaCalculator />,
            color: '#0891b2'
        },
        {
            id: 'math-form2',
            title: 'Mathematics',
            subtitle: 'Form 2',
            description: 'Enhanced Mathematics curriculum for Form 2 students',
            path: '/curriculum/skn-mathematics-form2',
            icon: <FaCalculator />,
            color: '#0891b2'
        },
        {
            id: 'social-form1',
            title: 'Social Science',
            subtitle: 'Form 1',
            description: 'Enhanced Social Science curriculum for Form 1 students',
            path: '/curriculum/skn-social-science',
            icon: <FaGlobe />,
            color: '#7c3aed'
        },
        {
            id: 'social-form2',
            title: 'Social Science',
            subtitle: 'Form 2',
            description: 'Enhanced Social Science curriculum for Form 2 students',
            path: '/curriculum/skn-social-science-form2',
            icon: <FaGlobe />,
            color: '#7c3aed'
        }
    ];

    return (
        <section id="curriculum" className="curriculum-access-section">
            <div className="container">
                <div className="text-center mb-5">
                    <div className="curriculum-badge">
                        <FaBook className="me-2" />
                        Official Curriculum
                    </div>
                    <h2 className="curriculum-section-title">
                        Ministry of Education Curriculum
                    </h2>
                    <p className="curriculum-section-subtitle">
                        Access the official enhanced curriculum for St. Kitts and Nevis. 
                        Explore comprehensive learning outcomes, teaching strategies, and assessment methods.
                    </p>
                </div>

                <div className="curriculum-grid">
                    {curriculumPages.map((curriculum) => (
                        <Link
                            key={curriculum.id}
                            to={curriculum.path}
                            className="curriculum-card"
                        >
                            <div 
                                className="curriculum-card-icon"
                                style={{ backgroundColor: `${curriculum.color}15`, color: curriculum.color }}
                            >
                                {curriculum.icon}
                            </div>
                            <div className="curriculum-card-content">
                                <div className="curriculum-card-header">
                                    <h3 className="curriculum-card-title">{curriculum.title}</h3>
                                    <span className="curriculum-card-badge">{curriculum.subtitle}</span>
                                </div>
                                <p className="curriculum-card-description">{curriculum.description}</p>
                                <div className="curriculum-card-link">
                                    View Curriculum <FaArrowRight className="ms-2" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="text-center mt-5">
                    <p className="curriculum-footer-note">
                        All curriculum content is aligned with OECS Learning Standards and International Best Practices
                    </p>
                </div>
            </div>
        </section>
    );
};

export default CurriculumAccess;

