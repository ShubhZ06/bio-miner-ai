import React from 'react';
import GraphViz from './GraphViz';

const GraphPage = ({ virusName, results }) => {
    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Knowledge Graph Visualization</h2>
                {results && (
                    <p className="page-subtitle">
                        Showing {results.relevant_findings} interactions for {results.target}
                    </p>
                )}
            </div>

            <div className="graph-container">
                {virusName ? (
                    <GraphViz virusName={virusName} />
                ) : (
                    <div className="empty-state">
                        <h3>No Data Yet</h3>
                        <p>Run an analysis to generate the knowledge graph</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GraphPage;
