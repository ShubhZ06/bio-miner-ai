import React, { useState, useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const archSectionRef = useRef(null);
    const workflowSectionRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (workflowSectionRef.current) {
                const rect = workflowSectionRef.current.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                // Start filling when the top of the section is at 70% of the viewport height
                const startOffset = windowHeight * 0.7;
                const endOffset = windowHeight * 0.2; // Finish when it's near the top

                const totalDistance = rect.height;
                const scrolled = startOffset - rect.top;

                let percentage = (scrolled / totalDistance) * 100;
                percentage = Math.min(100, Math.max(0, percentage));

                workflowSectionRef.current.style.setProperty('--scroll-progress', `${percentage}%`);
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );

        if (archSectionRef.current) {
            observer.observe(archSectionRef.current);
        }

        // Workflow Animation Observer
        const workflowObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        workflowObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.2 }
        );

        const steps = document.querySelectorAll('.workflow-step, .section-container');
        steps.forEach((step) => workflowObserver.observe(step));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (archSectionRef.current) {
                observer.unobserve(archSectionRef.current);
            }
            steps.forEach((step) => workflowObserver.unobserve(step));
        };
    }, []);

    return (
        <div className="landing-container">
            {/* Navbar */}
            <nav className="landing-navbar">
                <div className="nav-logo">Bio-Miner AI</div>
                <div className="nav-links">
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                    <a href="#architecture">Architecture</a>
                    <a href="#workflow">How It Works</a>
                    <a href="#tech-stack">Tech Stack</a>
                </div>
            </nav>

            <div className="landing-hero" id="home">
                <div className="spline-background">
                    <Spline
                        scene="https://prod.spline.design/3bC8lC-vY3jTZaWz/scene.splinecode"
                        className="spline-model"
                    />
                </div>
                <div className="hero-content">
                    <span className="intro-tag">● Mining 200 Papers in Real-Time</span>
                    <h1 className="hero-title">
                        Automated In-Silico<br />
                        <span className="gradient-text">Drug Discovery Engine</span>
                    </h1>
                    <p className="hero-subtitle">
                        Automated knowledge extraction from PubMed for rapid drug repurposing.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn-primary" onClick={() => navigate('/app')}>Start Analysis</button>
                    </div>
                </div>
            </div>

            <div className="about-section" id="about">
                <div className="section-container">
                    <h2 className="section-title">The Problem & Solution</h2>
                    <div className="gap-solution-grid">
                        <div className="info-card gap-card">
                            <h3>The Gap</h3>
                            <p>With over <strong>200 papers</strong> in PubMed, finding obscure connections between a drug used for one disease and a protein structure in a new virus is a massive "needle in a haystack" problem for human researchers.</p>
                        </div>
                        <div className="info-card solution-card">
                            <h3>Our Solution</h3>
                            <p>An autonomous pipeline that ingests abstracts from PubMed, reads text using <strong>Dual-BioBERT models</strong>, filters findings using context logic, and constructs a <strong>Knowledge Graph</strong> to visualize hidden relationships.</p>
                        </div>
                    </div>
                </div>

                <div className="section-container" id="architecture" ref={archSectionRef}>
                    <h2 className="section-title">Technical Architecture</h2>
                    <div className={`architecture-grid ${isVisible ? 'animate-cards' : ''}`}>
                        <div className="arch-card">
                            <h3>The "Brain" (NLP)</h3>
                            <p><strong>Dual-Model Approach:</strong> Uses BioBERT-Chemical and BioBERT-Disease models for precise NER.</p>
                            <p><strong>GPU Acceleration:</strong> Optimized for NVIDIA RTX 4060 using PyTorch CUDA tensors.</p>
                        </div>
                        <div className="arch-card">
                            <h3>Knowledge Graph</h3>
                            <p><strong>Neo4j Database:</strong> Stores findings as a graph network of Drugs, Viruses, and Papers.</p>
                            <p><strong>Smart Edges:</strong> Links candidates with confidence scores and source evidence.</p>
                        </div>
                        <div className="arch-card">
                            <h3>Data Pipeline</h3>
                            <p><strong>Scraper:</strong> Custom recursive XML parser built on Biopython.</p>
                            <p><strong>Resilience:</strong> Implements retry logic and polite backoff for NCBI API limits.</p>
                        </div>
                    </div>
                </div>

                <div className="section-container" id="workflow">
                    <h2 className="section-title">How It Works</h2>
                    <div className="workflow-grid" ref={workflowSectionRef}>
                        <div className="workflow-step">
                            <div className="step-number"></div>
                            <div className="workflow-step-content">
                                <div className="step-icon"></div>
                                <h3>Input Target</h3>
                                <p>Enter a viral target (e.g., "Zika Virus") to start the discovery process.</p>
                            </div>
                        </div>
                        <div className="workflow-step">
                            <div className="step-number"></div>
                            <div className="workflow-step-content">
                                <div className="step-icon"></div>
                                <h3>AI Scan</h3>
                                <p>Our Dual-BioBERT engine mines thousands of PubMed abstracts in real-time.</p>
                            </div>
                        </div>
                        <div className="workflow-step">
                            <div className="step-number"></div>
                            <div className="workflow-step-content">
                                <div className="step-icon"></div>
                                <h3>Graph Build</h3>
                                <p>Findings are structured into a Knowledge Graph of Drugs and Viruses.</p>
                            </div>
                        </div>
                        <div className="workflow-step">
                            <div className="step-number"></div>
                            <div className="workflow-step-content">
                                <div className="step-icon"></div>
                                <h3>Discover</h3>
                                <p>Explore ranked drug candidates with confidence scores and evidence.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="section-container" id="tech-stack">
                    <h2 className="section-title">Tech Stack</h2>
                    <div className="tech-stack-grid">
                        <div className="tech-item">Python 3.9+</div>
                        <div className="tech-item">FastAPI</div>
                        <div className="tech-item">PyTorch</div>
                        <div className="tech-item">HuggingFace</div>
                        <div className="tech-item">Neo4j</div>
                        <div className="tech-item">React.js</div>
                    </div>
                </div>

                <footer className="landing-footer">
                    <div className="footer-content-minimal">
                        <div className="footer-logo-minimal">
                            <span className="logo-icon">🧬</span> Bio-Miner AI
                        </div>
                        <div className="footer-copyright-minimal">
                            © 2025 Bio-Miner AI. Open Source License.
                        </div>
                        <div className="footer-links-minimal">
                            <a href="#home">Home</a>
                            <a href="#about">About</a>
                            <a href="#architecture">Architecture</a>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
