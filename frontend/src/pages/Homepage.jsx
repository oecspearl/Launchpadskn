import React from 'react';
import { Link } from 'react-router-dom';
import { FaRocket, FaBrain, FaChartLine, FaGraduationCap, FaChalkboardTeacher, FaLaptopCode } from 'react-icons/fa';
import './Homepage.css';

const Homepage = () => {
    return (
        <div className="homepage-container">
            <div className="homepage-bg-glow"></div>
            <div className="homepage-bg-glow-2"></div>

            <div className="homepage-content">
                {/* Hero Section */}
                <section className="hero-section">
                    <div className="hero-badge">
                        🚀 The Future of Education is Here
                    </div>
                    <h1 className="hero-title">
                        Empowering Education in <br />
                        <span>St. Kitts & Nevis</span>
                    </h1>
                    <p className="hero-subtitle">
                        Launchpad SKN is a next-generation learning platform powered by AI.
                        We provide students, teachers, and administrators with the tools they need
                        to succeed in the digital age.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/login" className="btn-glow">
                            Get Started
                        </Link>
                        <a href="#features" className="btn-outline-glow">
                            Learn More
                        </a>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="stats-section">
                    <div className="stat-item">
                        <span className="stat-number">50+</span>
                        <span className="stat-label">Schools</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">10k+</span>
                        <span className="stat-label">Students</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">99%</span>
                        <span className="stat-label">Satisfaction</span>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="features-section">
                    <h2 className="text-center mb-5" style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                        Why Choose <span style={{ color: 'var(--hp-primary)' }}>Launchpad SKN</span>?
                    </h2>
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
                </section>

                {/* Footer */}
                <footer className="homepage-footer">
                    <p>&copy; {new Date().getFullYear()} Launchpad SKN. All rights reserved.</p>
                    <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                        Built with ❤️ for the Federation.
                    </p>
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
