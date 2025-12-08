import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const GraphViz = ({ virusName }) => {
    // State to hold graph nodes and links
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const fgRef = useRef();

    // Adjust graph physics for better spacing
    useEffect(() => {
        if (fgRef.current) {
            // Increase repulsion between nodes to spread them out
            fgRef.current.d3Force('charge').strength(-400);
            // Increase distance of links
            fgRef.current.d3Force('link').distance(100);
        }
    }, [graphData]);

    // Fetch Graph Data from Backend API
    useEffect(() => {
        if (!virusName) return;

        fetch(`http://localhost:8000/graph/${virusName}`)
            .then(res => res.json())
            .then(data => {
                // Backend returns generic node/link structure
                setGraphData(data);
            })
            .catch(err => console.error("Error fetching graph data:", err));
    }, [virusName]);

    return (
        <div className="premium-card" style={{ height: '600px', padding: 0, overflow: 'hidden', position: 'relative' }}>
            {graphData.nodes.length > 0 ? (
                <ForceGraph2D
                    ref={fgRef}
                    graphData={graphData}
                    nodeLabel="id"
                    nodeColor={node => {
                        switch (node.type) {
                            case 'Virus': return '#4ade80'; // Green
                            case 'Drug': return '#60a5fa'; // Blue
                            case 'Paper': return '#f87171'; // Red
                            default: return '#94a3b8'; // Slate
                        }
                    }}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                        const label = node.id;
                        const fontSize = 14 / globalScale;
                        ctx.font = `600 ${fontSize}px Inter, sans-serif`;

                        // Measure text
                        const textWidth = ctx.measureText(label).width;
                        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.8);

                        // Draw Node Circle
                        const r = 6;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);

                        let color = '#94a3b8';
                        if (node.type === 'Virus') color = '#4ade80';
                        else if (node.type === 'Drug') color = '#60a5fa';
                        else if (node.type === 'Paper') color = '#f87171';

                        ctx.fillStyle = color;

                        // Glow
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = ctx.fillStyle;
                        ctx.fill();
                        ctx.shadowBlur = 0;

                        // Draw Label Card (Background)
                        const cardX = node.x - bckgDimensions[0] / 2;
                        const cardY = node.y + r + 2; // Below the node
                        const cardW = bckgDimensions[0];
                        const cardH = bckgDimensions[1];
                        const radius = 4;

                        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                        ctx.beginPath();
                        ctx.moveTo(cardX + radius, cardY);
                        ctx.lineTo(cardX + cardW - radius, cardY);
                        ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + radius);
                        ctx.lineTo(cardX + cardW, cardY + cardH - radius);
                        ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - radius, cardY + cardH);
                        ctx.lineTo(cardX + radius, cardY + cardH);
                        ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - radius);
                        ctx.lineTo(cardX, cardY + radius);
                        ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
                        ctx.closePath();
                        ctx.fill();

                        // Border for card
                        ctx.strokeStyle = '#e2e8f0';
                        ctx.lineWidth = 1 / globalScale;
                        ctx.stroke();

                        // Draw Label Text
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#1e293b';
                        ctx.fillText(label, node.x, cardY + cardH / 2);
                    }}
                    nodePointerAreaPaint={(node, color, ctx) => {
                        ctx.fillStyle = color;
                        const r = 6;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                        ctx.fill();
                    }}
                    linkDirectionalArrowLength={4}
                    linkDirectionalArrowRelPos={1}
                    linkColor={() => '#cbd5e1'} // Slate 300
                    linkCanvasObject={(link, ctx, globalScale) => {
                        const start = link.source;
                        const end = link.target;

                        if (typeof start !== 'object' || typeof end !== 'object') return;

                        // Draw Line
                        ctx.beginPath();
                        ctx.moveTo(start.x, start.y);
                        ctx.lineTo(end.x, end.y);
                        ctx.lineWidth = 1 / globalScale;
                        ctx.strokeStyle = '#cbd5e1';
                        ctx.stroke();

                        // Draw Label
                        const label = link.label || link.type || '';
                        if (label) {
                            const contrastLabel = label.toLowerCase(); // User requested "potential candidate" format
                            const fontSize = 10 / globalScale;
                            ctx.font = `${fontSize}px Inter, sans-serif`;
                            const textWidth = ctx.measureText(contrastLabel).width;
                            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.5);

                            // Calculate midpoint
                            const relLink = { x: end.x - start.x, y: end.y - start.y };
                            const maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - 10;

                            // Only draw if link is long enough
                            if (maxTextLength > textWidth) {
                                const textPos = {
                                    x: start.x + relLink.x * 0.5,
                                    y: start.y + relLink.y * 0.5
                                };
                                const textAngle = Math.atan2(relLink.y, relLink.x);

                                ctx.save();
                                ctx.translate(textPos.x, textPos.y);
                                ctx.rotate(textAngle);

                                // Ensure text is right-side up
                                if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) {
                                    ctx.rotate(Math.PI);
                                }

                                // Background for text for readability
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                                ctx.fillRect(-bckgDimensions[0] / 2, -bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillStyle = '#64748b'; // Slate 500
                                ctx.fillText(contrastLabel, 0, 0);
                                ctx.restore();
                            }
                        }
                    }}

                    backgroundColor="#f8fafc" // Slate 50
                    onNodeClick={node => {
                        // Center view on node
                        fgRef.current.centerAt(node.x, node.y, 1000);
                        fgRef.current.zoom(8, 2000);
                    }}
                />
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🕸️</div>
                        {virusName ? "Building Knowledge Graph..." : "Ready to Analyze"}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GraphViz;
