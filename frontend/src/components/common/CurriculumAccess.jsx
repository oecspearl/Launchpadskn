import React from 'react';
import { Link } from 'react-router-dom';
import { FaBook, FaCalculator, FaGlobe, FaArrowRight } from 'react-icons/fa';
import './CurriculumAccess.css';

const curriculumPages = [
    {
        id: 'math-form1',
        title: 'Mathematics',
        subtitle: 'Form 1',
        description: 'Enhanced Mathematics curriculum for Form 1 students',
        path: '/curriculum/skn-mathematics',
        icon: <FaCalculator size={20} aria-hidden="true" />,
        accent: 'green'
    },
    {
        id: 'math-form2',
        title: 'Mathematics',
        subtitle: 'Form 2',
        description: 'Enhanced Mathematics curriculum for Form 2 students',
        path: '/curriculum/skn-mathematics-form2',
        icon: <FaCalculator size={20} aria-hidden="true" />,
        accent: 'green'
    },
    {
        id: 'social-form1',
        title: 'Social Science',
        subtitle: 'Form 1',
        description: 'Enhanced Social Science curriculum for Form 1 students',
        path: '/curriculum/skn-social-science',
        icon: <FaGlobe size={20} aria-hidden="true" />,
        accent: 'purple'
    },
    {
        id: 'social-form2',
        title: 'Social Science',
        subtitle: 'Form 2',
        description: 'Enhanced Social Science curriculum for Form 2 students',
        path: '/curriculum/skn-social-science-form2',
        icon: <FaGlobe size={20} aria-hidden="true" />,
        accent: 'purple'
    }
];

const CurriculumAccess = () => (
    <div className="curriculum-access" id="curriculum">
        <div className="ca-header">
            <div className="ca-eyebrow">
                <span className="ca-eyebrow-line" aria-hidden="true" />
                Open access
            </div>
            <h2 className="ca-title">Explore the<br />Curriculum</h2>
        </div>

        <div className="ca-panel">
            <div className="ca-panel-head">
                <div className="ca-badge">
                    <FaBook size={15} aria-hidden="true" /> Official Curriculum
                </div>
                <h3 className="ca-panel-title">Ministry of Education Curriculum</h3>
                <p className="ca-panel-sub">
                    Access the official enhanced curriculum for St. Kitts and Nevis. Explore
                    comprehensive learning outcomes, teaching strategies, and assessment methods.
                </p>
            </div>

            <div className="ca-grid">
                {curriculumPages.map((curriculum) => (
                    <Link key={curriculum.id} to={curriculum.path} className="ca-card">
                        <div className={`ca-card-icon ca-icon-${curriculum.accent}`}>
                            {curriculum.icon}
                        </div>
                        <div className="ca-card-head">
                            <span className="ca-card-title">{curriculum.title}</span>
                            <span className="ca-card-form">{curriculum.subtitle}</span>
                        </div>
                        <p className="ca-card-desc">{curriculum.description}</p>
                        <span className="ca-card-link">
                            View Curriculum <FaArrowRight size={14} aria-hidden="true" />
                        </span>
                    </Link>
                ))}
            </div>

            <p className="ca-note">
                All curriculum content is aligned with OECS Learning Standards and International Best Practices
            </p>
        </div>
    </div>
);

export default CurriculumAccess;
