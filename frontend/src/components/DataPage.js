import React, { useEffect, useState } from 'react';

const DataPage = ({ virusName }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!virusName) return;

        setLoading(true);
        fetch(`http://localhost:8000/data/${virusName}`)
            .then(res => res.json())
            .then(interactions => {
                setData(interactions);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching data:", err);
                setLoading(false);
            });
    }, [virusName]);

    if (!virusName) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <h3>No Data Yet</h3>
                    <p>Run an analysis to see detailed findings</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <h3>Loading...</h3>
                    <p>Fetching data from database</p>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <h3>No Interactions Found</h3>
                    <p>No drug-virus interactions found in the database for {virusName}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="section-container visible">
            <div className="section-header" style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h2 className="section-title">Analysis Findings</h2>
                <p className="hero-subtitle" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    Successfully identified <strong>{data.length}</strong> potential drug repurposing candidates for <strong>{virusName}</strong>.
                </p>
            </div>

            <div className="data-findings" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
                {data.map((interaction, idx) => (
                    <div key={idx} className="premium-card">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                            <div className="card-icon">💊</div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--secondary-color)' }}>{interaction.drug}</h3>
                                <span className="intro-tag" style={{ border: 'none', padding: '4px 12px', fontSize: '0.8rem', background: 'rgba(14, 165, 233, 0.1)' }}>
                                    Confidence: {interaction.confidence}
                                </span>
                            </div>
                        </div>

                        <div className="evidence-text" style={{ lineHeight: '1.6', color: 'var(--text-muted)', marginBottom: '20px' }}>
                            <p>
                                The analysis suggests that <strong>{interaction.drug}</strong> interacts with <strong>{virusName}</strong> based on semantic relationships found in the literature.
                            </p>
                            <div style={{ background: 'rgba(241, 245, 249, 0.5)', padding: '15px', borderRadius: '12px', borderLeft: '4px solid var(--primary-color)', fontStyle: 'italic', fontSize: '0.95rem' }}>
                                "{interaction.evidence}"
                            </div>
                        </div>

                        {interaction.papers && interaction.papers.length > 0 && (
                            <div className="paper-info" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '1.2rem' }}>📄</span>
                                <small style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                                    Supported by {interaction.papers.length} research paper{interaction.papers.length !== 1 ? 's' : ''}
                                </small>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DataPage;
