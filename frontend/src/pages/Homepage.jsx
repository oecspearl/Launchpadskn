import React from 'react';
import { Link } from 'react-router-dom';
import {
    FaRocket, FaBrain, FaChartLine, FaGraduationCap,
    FaChalkboardTeacher, FaLaptopCode, FaArrowRight,
    FaBookOpen, FaUsers, FaCertificate
} from 'react-icons/fa';
import CurriculumAccess from '../components/common/CurriculumAccess';
import './Homepage.css';

const Homepage = () => {
    return (
        <div className="homepage-container">
            {/* Floating Menu (Right Side) - Cleaner */}
            <div className="floating-menu">
                <div className="floating-menu-item" title="Courses">
                    <FaBookOpen />
                </div>
                <div className="floating-menu-item" title="Community">
                    <FaUsers />
                </div>
                <div className="floating-menu-item" title="Certificates">
                    <FaCertificate />
                </div>
            </div>

            <div className="homepage-content">
                {/* Hero Section */}
                <section className="hero-section">
                    <div className="container">
                        <div className="row align-items-center">
                            <div className="col-lg-6 mb-5 mb-lg-0">
                                <div className="hero-content-wrapper">
                                    <span className="hero-badge">
                                        🚀 The Future of Education in SKN
                                    </span>
                                    <h1 className="hero-title">
                                        Unlock Your Potential with <span>Launchpad SKN</span>
                                    </h1>
                                    <p className="hero-subtitle">
                                        Access world-class education, AI-powered personalized learning, and a supportive community.
                                        Empowering every student and teacher in the Federation.
                                    </p>
                                    <div className="d-flex flex-wrap gap-3">
                                        <Link to="/login" className="btn-primary-custom text-decoration-none">
                                            Get Started <FaArrowRight />
                                        </Link>
                                        <a href="#features" className="btn-secondary-custom text-decoration-none">
                                            Learn More
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-6">
                                <div className="hero-image-container">
                                    {/* SKN Flag Colors Decorative Background */}
                                    <div className="skn-flag-background">
                                        <div className="flag-stripe flag-green"></div>
                                        <div className="flag-stripe flag-yellow"></div>
                                        <div className="flag-stripe flag-black"></div>
                                    </div>
                                    
                                    {/* SKN Image with Frame */}
                                    <div className="skn-image-frame">
                                        <img
                                            src="/skn.png"
                                            alt="St. Kitts and Nevis - Federation of the Caribbean"
                                            className="skn-hero-image"
                                            onError={(e) => {
                                                // Fallback if skn.png doesn't exist, try snk.png
                                                if (e.target.src !== '/snk.png') {
                                                    e.target.src = '/snk.png';
                                                }
                                            }}
                                        />
                                        <div className="skn-image-overlay">
                                            <div className="skn-badge-text">
                                                Federation of<br />St. Kitts & Nevis
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Decorative Elements */}
                                    <div className="hero-decorative-elements">
                                        <div className="decorative-circle circle-1"></div>
                                        <div className="decorative-circle circle-2"></div>
                                        <div className="decorative-circle circle-3"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="stats-section">
                    <div className="container">
                        <div className="row">
                            <div className="col-md-4">
                                <div className="stat-item">
                                    <span className="stat-number">50+</span>
                                    <span className="stat-label">Partner Schools</span>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="stat-item">
                                    <span className="stat-number">10k+</span>
                                    <span className="stat-label">Active Students</span>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="stat-item">
                                    <span className="stat-number">99%</span>
                                    <span className="stat-label">Satisfaction Rate</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="features-section">
                    <div className="container">
                        <div className="text-center mb-5">
                            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--hp-text-dark)' }}>
                                Why Choose Launchpad SKN?
                            </h2>
                            <p className="text-muted mt-3" style={{ maxWidth: '600px', margin: '0 auto' }}>
                                We combine cutting-edge technology with local educational needs to create a platform that truly delivers.
                            </p>
                        </div>

                        <div className="features-grid">
                            <FeatureCard
                                icon={<FaBrain />}
                                title="AI-Powered Curriculum"
                                description="Generate comprehensive lesson plans and curriculum frameworks instantly with our advanced AI engine."
                            />
                            <FeatureCard
                                icon={<FaChartLine />}
                                title="Real-time Analytics"
                                description="Track student progress, attendance, and performance with detailed, actionable insights."
                            />
                            <FeatureCard
                                icon={<FaLaptopCode />}
                                title="Interactive Learning"
                                description="Engage students with gamified lessons, virtual labs, and multimedia resources."
                            />
                            <FeatureCard
                                icon={<FaChalkboardTeacher />}
                                title="Teacher Tools"
                                description="Streamline grading, assignment management, and communication with parents."
                            />
                            <FeatureCard
                                icon={<FaGraduationCap />}
                                title="Personalized Paths"
                                description="Adaptive learning paths that cater to each student's unique pace and learning style."
                            />
                            <FeatureCard
                                icon={<FaRocket />}
                                title="Future Ready"
                                description="Preparing the youth of St. Kitts & Nevis for the global digital economy."
                            />
                        </div>
                    </div>
                </section>

                {/* Curriculum Access Section */}
                <CurriculumAccess />

                {/* Footer */}
                <footer className="homepage-footer">
                    <div className="container">
                        <p className="mb-2">&copy; {new Date().getFullYear()} Launchpad SKN. All rights reserved.</p>
                        <p className="small text-muted">
                            Built with ❤️ for the Federation of St. Kitts & Nevis.
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="feature-card">
        <div className="feature-icon">
            {icon}
        </div>
        <h3 className="feature-title">{title}</h3>
        <p className="feature-desc">{description}</p>
    </div>
);

export default Homepage;
