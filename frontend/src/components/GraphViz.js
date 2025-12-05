import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const GraphViz = ({ virusName }) => {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const fgRef = useRef();

    useEffect(() => {
        if (!virusName) return;

        fetch(`http://localhost:8000/graph/${virusName}`)
            .then(res => res.json())
            .then(data => {
                // Transform data if necessary to match react-force-graph format
                // Assuming backend returns { nodes: [{id, label, type}], links: [{source, target, type}] }
                setGraphData(data);
            })
            .catch(err => console.error("Error fetching graph data:", err));
    }, [virusName]);

    return (
        <div style={{ height: '500px', border: '1px solid #dfe6e9', borderRadius: '8px', overflow: 'hidden' }}>
            {graphData.nodes.length > 0 ? (
                <ForceGraph2D
                    ref={fgRef}
                    graphData={graphData}
                    nodeLabel="id"
                    nodeColor={node => node.type === 'Drug' ? '#00b894' : node.type === 'Virus' ? '#ff7675' : '#74b9ff'}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                        const label = node.id;
                        const fontSize = 12 / globalScale;
                        ctx.font = `${fontSize}px Sans-Serif`;

                        // Draw Node Circle
                        const r = 4;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                        ctx.fillStyle = node.color || '#ccc';
                        ctx.fill();

                        // Draw Label
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#2d3436';
                        ctx.fillText(label, node.x, node.y + r + fontSize);
                    }}
                    nodePointerAreaPaint={(node, color, ctx) => {
                        ctx.fillStyle = color;
                        const r = 4;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                        ctx.fill();
                    }}
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    backgroundColor="#ffffff"
                    onNodeClick={node => {
                        // Center view on node
                        fgRef.current.centerAt(node.x, node.y, 1000);
                        fgRef.current.zoom(8, 2000);
                    }}
                />
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                    {virusName ? "Loading Graph..." : "Run analysis to generate graph"}
                </div>
            )}
        </div>
    );
};

export default GraphViz;
