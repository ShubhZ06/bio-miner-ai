import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import GraphViz from './GraphViz';
import DataPage from './DataPage';

const TABS = [
    { key: 'graph', label: '🕸️ Knowledge Graph' },
    { key: 'data', label: '💊 Drug Candidates' },
    { key: 'papers', label: '📄 Source Papers' },
];

function Dashboard() {
    const location = useLocation();
    const [virusName, setVirusName] = useState('');
    const [limit, setLimit] = useState(50);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('graph');

    const abortControllerRef = useRef(null);

    useEffect(() => {
        if (location.state?.searchQuery) {
            setVirusName(location.state.searchQuery);
            if (location.state.limit) setLimit(location.state.limit);
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
        if (abortControllerRef.current) abortControllerRef.current.abort();

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        setError(null);
        setResults(null);
        setProgress(0);
        setProgressStage('Initializing...');
        setActiveTab('graph');

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
                        console.error('Error parsing stream chunk:', e);
                    }
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                setLoading(false);
                setProgressStage('Cancelled');
                return;
            }
            setError('Failed to connect to backend. Is it running?');
            setLoading(false);
        } finally {
            abortControllerRef.current = null;
        }
    };

    useEffect(() => {
        if (location.state?.searchQuery && !results && !loading && !error) {
            handleScan();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [virusName]);

    // Collect unique papers from results
    const allPapers = results?.data
        ? results.data.flatMap(r => r.matches.map(m => ({ title: r.title, pmid: r.pmid, drug: m.drug, context: m.context })))
        : [];

    const uniquePapers = [...new Map(allPapers.map(p => [p.title, p])).values()];

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
                {/* Control Panel */}
                <div className="control-panel">
                    <div className="input-group">
                        <label>Viral Target</label>
                        <input
                            type="text"
                            placeholder="e.g. Dengue Virus"
                            value={virusName}
                            onChange={(e) => setVirusName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                        />
                    </div>
                    <div className="input-group">
                        <label>Paper Limit</label>
                        <input
                            type="number"
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                            min="1" max="200"
                        />
                    </div>
                    <button onClick={handleScan} disabled={loading || !virusName}>
                        {loading ? 'Scanning...' : 'Start Analysis'}
                    </button>
                    {loading && (
                        <button onClick={handleCancel} style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid #ef4444' }}>
                            Cancel
                        </button>
                    )}
                </div>

                {/* Progress Bar */}
                {(loading || results) && (
                    <div className="progress-container" style={{ maxWidth: '800px', margin: '20px auto', padding: '0 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-color)' }}>
                            <span style={{ fontWeight: '500' }}>
                                {loading ? progressStage : '✅ Research & Analysis Complete'}
                            </span>
                            <span>{loading ? `${progress}%` : '100%'}</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${loading ? progress : 100}%`, height: '100%',
                                background: loading ? 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))' : '#10b981',
                                transition: 'width 0.5s ease-out',
                                boxShadow: loading ? 'none' : '0 0 10px rgba(16,185,129,0.5)'
                            }} />
                        </div>
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                {/* Results Section */}
                {results && !loading && (
                    <div className="results-container">
                        {/* Stats Row */}
                        <div className="stats-panel">
                            <div className="stat-card">
                                <h3>Target</h3>
                                <p>{results.target}</p>
                            </div>
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

                        {/* Tab Bar */}
                        <div style={{
                            display: 'flex', gap: '4px', margin: '30px 0 0',
                            borderBottom: '2px solid var(--border)', padding: '0 4px'
                        }}>
                            {TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    style={{
                                        padding: '12px 24px', border: 'none', cursor: 'pointer',
                                        background: 'transparent', fontSize: '0.9rem', fontWeight: '600',
                                        color: activeTab === tab.key ? 'var(--primary-color)' : 'var(--text-muted)',
                                        borderBottom: activeTab === tab.key ? '2px solid var(--primary-color)' : '2px solid transparent',
                                        marginBottom: '-2px', transition: 'all 0.2s', borderRadius: '8px 8px 0 0',
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    {tab.label}
                                    {tab.key === 'data' && (
                                        <span style={{
                                            marginLeft: '8px', background: 'rgba(99,102,241,0.2)',
                                            color: 'var(--primary-color)', borderRadius: '10px',
                                            padding: '2px 8px', fontSize: '0.75rem'
                                        }}>
                                            {results.relevant_findings}
                                        </span>
                                    )}
                                    {tab.key === 'papers' && (
                                        <span style={{
                                            marginLeft: '8px', background: 'rgba(99,102,241,0.2)',
                                            color: 'var(--primary-color)', borderRadius: '10px',
                                            padding: '2px 8px', fontSize: '0.75rem'
                                        }}>
                                            {uniquePapers.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div style={{ marginTop: '0' }}>

                            {/* Graph Tab */}
                            {activeTab === 'graph' && (
                                <div className="premium-card" style={{ padding: 0, overflow: 'hidden', minHeight: '560px' }}>
                                    <GraphViz virusName={results.target} />
                                </div>
                            )}

                            {/* Data Tab */}
                            {activeTab === 'data' && (
                                <DataPage virusName={results.target} />
                            )}

                            {/* Papers Tab */}
                            {activeTab === 'papers' && (
                                <div style={{ padding: '24px 0' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{
                                            width: '100%', borderCollapse: 'collapse',
                                            fontSize: '0.88rem', color: 'var(--text-color)'
                                        }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                                    {['#', 'Paper Title', 'Drug Candidate', 'Evidence Sentence', 'PMID'].map(h => (
                                                        <th key={h} style={{
                                                            padding: '12px 16px', textAlign: 'left',
                                                            color: 'var(--text-muted)', fontWeight: '600',
                                                            fontSize: '0.78rem', letterSpacing: '0.05em',
                                                            textTransform: 'uppercase', whiteSpace: 'nowrap'
                                                        }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {uniquePapers.map((paper, idx) => (
                                                    <tr key={idx} style={{
                                                        borderBottom: '1px solid var(--border)',
                                                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                                                        transition: 'background 0.15s'
                                                    }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                                                    >
                                                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>{idx + 1}</td>
                                                        <td style={{ padding: '14px 16px', maxWidth: '280px' }}>
                                                            <span style={{ fontWeight: '500' }}>{paper.title}</span>
                                                        </td>
                                                        <td style={{ padding: '14px 16px' }}>
                                                            <span style={{
                                                                background: 'rgba(96,165,250,0.15)', color: '#60a5fa',
                                                                borderRadius: '20px', padding: '4px 12px',
                                                                fontWeight: '600', fontSize: '0.82rem', whiteSpace: 'nowrap'
                                                            }}>
                                                                💊 {paper.drug}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '14px 16px', maxWidth: '320px', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.5' }}>
                                                            "{paper.context?.slice(0, 120)}{paper.context?.length > 120 ? '…' : ''}"
                                                        </td>
                                                        <td style={{ padding: '14px 16px' }}>
                                                            {paper.pmid ? (
                                                                <a
                                                                    href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}`}
                                                                    target="_blank" rel="noreferrer"
                                                                    style={{ color: 'var(--primary-color)', fontWeight: '600', fontSize: '0.82rem', textDecoration: 'none' }}
                                                                >
                                                                    {paper.pmid} ↗
                                                                </a>
                                                            ) : (
                                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Dashboard;
