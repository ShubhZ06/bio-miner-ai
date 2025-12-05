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
        <div className="page-container">
            <div className="page-header">
                <h2>Drug-Virus Interactions</h2>
                <p className="page-subtitle">
                    Showing {data.length} interactions for {virusName}
                </p>
            </div>

            <div className="data-findings">
                {data.map((interaction, idx) => (
                    <div key={idx} className="data-card">
                        <div className="drug-badge">
                            <span className="drug-icon">💊</span>
                            <span className="drug-name">{interaction.drug}</span>
                            <span className="confidence-badge">Confidence: {interaction.confidence}</span>
                        </div>
                        <div className="evidence-text">
                            "{interaction.evidence}"
                        </div>
                        {interaction.papers && interaction.papers.length > 0 && (
                            <div className="paper-info">
                                <small>📄 Found in {interaction.papers.length} paper(s)</small>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DataPage;
