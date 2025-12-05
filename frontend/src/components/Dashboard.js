import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import GraphPage from './GraphPage';
import DataPage from './DataPage';

function Dashboard() {
    const location = useLocation();
    const [virusName, setVirusName] = useState('');
    const [limit, setLimit] = useState(50);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    // Auto-search if query param exists or state is passed
    useEffect(() => {
        if (location.state?.searchQuery) {
            setVirusName(location.state.searchQuery);
            if (location.state.limit) {
                setLimit(location.state.limit);
            }
        }
    }, [location.state]);

    const handleScan = async () => {
        if (!virusName) return;

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const response = await fetch(`http://localhost:8000/scan/${virusName}?limit=${limit}`);
            const data = await response.json();

            if (data.status === 'empty') {
                setError(data.message);
            } else {
                setResults(data);
            }
        } catch (err) {
            setError("Failed to connect to backend. Is it running?");
            console.error(err);
        } finally {
            setLoading(false);
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
        <div className="App">
            <header className="App-header">
                <h1>🧬 Bio-Miner AI</h1>
                <p>Automated Drug Repurposing Engine</p>
            </header>

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
                        {loading ? 'Scanning PubMed...' : 'Start Analysis'}
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                {results && (
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
