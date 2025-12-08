import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import GraphPage from './GraphPage';
import DataPage from './DataPage';

function Dashboard() {
    const location = useLocation();
    const [virusName, setVirusName] = useState('');
    const [limit, setLimit] = useState(50);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const abortControllerRef = useRef(null);

    // Auto-search if query param exists or state is passed
    useEffect(() => {
        if (location.state?.searchQuery) {
            setVirusName(location.state.searchQuery);
            if (location.state.limit) {
                setLimit(location.state.limit);
            }
        }
    }, [location.state]);

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setLoading(false);
        setProgressStage('Scan cancelled');
        setError(null);
    };

    const handleScan = async () => {
        if (!virusName) return;

        // Cancel previous request if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        setError(null);
        setResults(null);
        setProgress(0);
        setProgressStage('Initializing...');

        try {
            const response = await fetch(`http://localhost:8000/scan/${virusName}?limit=${limit}`, {
                signal: controller.signal
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                // Handle multiple JSON objects in one chunk
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);

                        if (data.status === 'progress') {
                            setProgress(data.percent);
                            setProgressStage(data.stage);
                        } else if (data.status === 'complete') {
                            setResults(data.data);
                            setLoading(false);
                            setProgress(100);
                        } else if (data.status === 'error') {
                            setError(data.message);
                            setLoading(false);
                        }
                    } catch (e) {
                        console.error("Error parsing stream chunk:", e);
                    }
                }
            }

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Fetch aborted');
                setLoading(false);
                setProgressStage('Cancelled');
                return;
            }
            setError("Failed to connect to backend. Is it running?");
            console.error(err);
            setLoading(false);
        } finally {
            abortControllerRef.current = null;
        }
    };

    // Trigger scan if virusName is set from landing page and we haven't scanned yet
    useEffect(() => {
        if (location.state?.searchQuery && !results && !loading && !error) {
            handleScan();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [virusName]);


    return (

        <div className="landing-container" style={{ paddingTop: '80px' }}>
            <nav className="landing-navbar">
                <div className="nav-logo" onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
                    Bio-Miner AI
                </div>
                <div className="nav-links">
                    <a href="/">Home</a>
                </div>
            </nav>

            <main className="App-main">
                <div className="control-panel">
                    <div className="input-group">
                        <label>Viral Target</label>
                        <input
                            type="text"
                            placeholder="e.g. Dengue Virus"
                            value={virusName}
                            onChange={(e) => setVirusName(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label>Paper Limit</label>
                        <input
                            type="number"
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                            min="1"
                            max="100"
                        />
                    </div>
                    <button onClick={handleScan} disabled={loading || !virusName}>
                        {loading ? 'Scanning...' : 'Start Analysis'}
                    </button>

                    {loading && (
                        <button
                            onClick={handleCancel}
                            style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#fca5a5',
                                border: '1px solid #ef4444'
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {/* Progress Bar Area - Visible during loading OR when results exist */}
                {(loading || results) && (
                    <div className="progress-container" style={{ maxWidth: '800px', margin: '20px auto', padding: '0 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-color)' }}>
                            <span style={{ fontWeight: '500' }}>
                                {loading ? progressStage : 'Research & Analysis Complete'}
                            </span>
                            <span>{loading ? `${progress}%` : '100%'}</span>
                        </div>
                        <div style={{
                            height: '10px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '5px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${loading ? progress : 100}%`,
                                height: '100%',
                                background: loading
                                    ? 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))'
                                    : '#10b981', // Explicit Green
                                transition: 'width 0.5s ease-out',
                                boxShadow: loading ? 'none' : '0 0 10px rgba(16, 185, 129, 0.5)'
                            }} />
                        </div>
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                {results && !loading && (
                    <div className="results-container">
                        <div className="stats-panel">
                            <div className="stat-card">
                                <h3>Scanned</h3>
                                <p>{results.scanned_count} Papers</p>
                            </div>
                            <div className="stat-card">
                                <h3>Findings</h3>
                                <p>{results.relevant_findings} Interactions</p>
                            </div>
                            <div className="stat-card">
                                <h3>Time</h3>
                                <p>{results.execution_time}</p>
                            </div>
                        </div>

                        <div className="data-section">
                            <DataPage virusName={results.target} />
                        </div>

                        <div className="graph-section">
                            <GraphPage virusName={results.target} results={results} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Dashboard;
