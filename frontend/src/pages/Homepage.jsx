import React from 'react';
import { Link } from 'react-router-dom';
import {
    FaRocket, FaBrain, FaChartLine, FaGraduationCap,
    FaChalkboardTeacher, FaLaptopCode, FaShoppingCart,
    FaImages, FaCreditCard, FaBars
} from 'react-icons/fa';
import './Homepage.css';

const Homepage = () => {
    return (
        <div className="homepage-container">
            {/* Floating Menu (Right Side) */}
            <div className="floating-menu">
                <div className="floating-menu-item" title="Shop">
                    <FaShoppingCart />
                </div>
                <div className="floating-menu-item" title="Gallery">
                    <FaImages />
                </div>
                <div className="floating-menu-item" title="Pricing">
                    <FaCreditCard />
                </div>
            </div>

            <div className="homepage-content">
                {/* Hero Section */}
                <section className="hero-section">
                    <div className="row align-items-center w-100">
                        <div className="col-lg-6">
                            <h1 className="hero-title">
                                Launchpad SKN.
                                <span>Empowering Education in the Federation</span>
                            </h1>
                            <p className="hero-subtitle">
                                Take great courses from the world's best universities and local institutions.
                                Powered by AI to deliver a personalized learning experience for every student in St. Kitts & Nevis.
                            </p>
                            <div className="hero-buttons">
                                <Link to="/login" className="btn-primary-custom text-decoration-none">
                                    Get Started
                                </Link>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="laptop-container">
                                {/* Placeholder for Laptop Image - using a high quality placeholder */}
                                <img
                                    src="https://placehold.co/900x600/1e293b/ffffff?text=Launchpad+SKN+Platform"
                                    alt="Launchpad SKN Platform on Laptop"
                                    className="laptop-image"
                                />
                            </div>
                        </div>
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
                    <h2 className="text-center mb-5" style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white' }}>
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
