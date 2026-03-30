import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const NODE_COLORS = {
    Virus: '#4ade80',
    Drug: '#60a5fa',
    Paper: '#f87171',
    default: '#94a3b8',
};

const GraphViz = ({ virusName }) => {
    const [rawData, setRawData] = useState({ nodes: [], links: [] });
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [filter, setFilter] = useState('drug-virus');
    const [highlightNode, setHighlightNode] = useState(null);
    const fgRef = useRef();

    useEffect(() => {
        if (!virusName) return;
        fetch(`http://localhost:8000/graph/${virusName}`)
            .then(res => res.json())
            .then(data => setRawData(data))
            .catch(err => console.error('Error fetching graph data:', err));
    }, [virusName]);

    useEffect(() => {
        if (!rawData.nodes.length) return;

        let nodes, links;

        if (filter === 'drug-virus') {
            const allowed = new Set(
                rawData.nodes
                    .filter(n => n.type === 'Drug' || n.type === 'Virus')
                    .map(n => n.id)
            );
            nodes = rawData.nodes.filter(n => allowed.has(n.id));
            links = rawData.links.filter(
                l => allowed.has(l.source?.id ?? l.source) && allowed.has(l.target?.id ?? l.target)
            );
        } else {
            nodes = rawData.nodes;
            links = rawData.links;
        }

        const seen = new Set();
        nodes = nodes.filter(n => {
            if (seen.has(n.id)) return false;
            seen.add(n.id);
            return true;
        });

        setGraphData({ nodes, links });
    }, [rawData, filter]);

    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force('charge').strength(-500);
            fgRef.current.d3Force('link').distance(filter === 'drug-virus' ? 140 : 100);
        }
    }, [graphData, filter]);

    const drawNode = useCallback((node, ctx, globalScale) => {
        const isHighlighted = highlightNode === node.id;
        const isVirus = node.type === 'Virus';
        const isDrug = node.type === 'Drug';
        const color = NODE_COLORS[node.type] || NODE_COLORS.default;

        const r = isVirus ? 10 : isDrug ? 7 : 5;

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.shadowBlur = isHighlighted ? 20 : 10;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isHighlighted) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI, false);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
        }

        if (globalScale < 0.5) return;

        const rawLabel = node.type === 'Paper'
            ? (node.label && node.label.length > 25 ? node.label.slice(0, 25) + '…' : node.label)
            : node.id;

        const fontSize = isVirus
            ? Math.min(14, 14 / globalScale)
            : Math.min(11, 11 / globalScale);

        ctx.font = `${isVirus ? '700' : '500'} ${fontSize}px Inter, sans-serif`;
        const textWidth = ctx.measureText(rawLabel).width;
        const pad = fontSize * 0.5;
        const cardW = textWidth + pad * 2;
        const cardH = fontSize + pad;
        const cardX = node.x - cardW / 2;
        const cardY = node.y + r + 3;
        const rad = 4;

        ctx.fillStyle = isHighlighted ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.88)';
        ctx.beginPath();
        ctx.moveTo(cardX + rad, cardY);
        ctx.lineTo(cardX + cardW - rad, cardY);
        ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + rad);
        ctx.lineTo(cardX + cardW, cardY + cardH - rad);
        ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - rad, cardY + cardH);
        ctx.lineTo(cardX + rad, cardY + cardH);
        ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - rad);
        ctx.lineTo(cardX, cardY + rad);
        ctx.quadraticCurveTo(cardX, cardY, cardX + rad, cardY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isHighlighted ? color : '#e2e8f0';
        ctx.lineWidth = (isHighlighted ? 1.5 : 1) / globalScale;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isVirus ? '#064e3b' : '#1e293b';
        ctx.fillText(rawLabel, node.x, cardY + cardH / 2);
    }, [highlightNode]);

    const stats = {
        drugs: rawData.nodes.filter(n => n.type === 'Drug').length,
        papers: rawData.nodes.filter(n => n.type === 'Paper').length,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', background: 'rgba(255,255,255,0.05)',
                borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '10px'
            }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    {[
                        { color: NODE_COLORS.Virus, label: '1 Virus' },
                        { color: NODE_COLORS.Drug, label: `${stats.drugs} Drugs` },
                        { color: NODE_COLORS.Paper, label: `${stats.papers} Papers` },
                    ].map(({ color, label }) => (
                        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}` }} />
                            {label}
                        </span>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                        { key: 'drug-virus', label: '💊 Drug–Virus Only' },
                        { key: 'all', label: '📄 Full Graph' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            style={{
                                padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem',
                                border: filter === key ? '1px solid var(--primary-color)' : '1px solid var(--border)',
                                background: filter === key ? 'rgba(99,102,241,0.2)' : 'transparent',
                                color: filter === key ? 'var(--primary-color)' : 'var(--text-muted)',
                                cursor: 'pointer', transition: 'all 0.2s',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                    <button
                        onClick={() => fgRef.current?.zoomToFit(400, 40)}
                        style={{
                            padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem',
                            border: '1px solid var(--border)', background: 'transparent',
                            color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                    >
                        ⟲ Fit
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                {graphData.nodes.length > 0 ? (
                    <ForceGraph2D
                        ref={fgRef}
                        graphData={graphData}
                        nodeLabel="id"
                        nodeColor={node => NODE_COLORS[node.type] || NODE_COLORS.default}
                        nodeCanvasObject={drawNode}
                        nodePointerAreaPaint={(node, color, ctx) => {
                            ctx.fillStyle = color;
                            const r = node.type === 'Virus' ? 10 : 7;
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                            ctx.fill();
                        }}
                        onNodeHover={node => setHighlightNode(node ? node.id : null)}
                        onNodeClick={node => {
                            fgRef.current.centerAt(node.x, node.y, 600);
                            fgRef.current.zoom(6, 800);
                        }}
                        linkDirectionalArrowLength={0}
                        linkCanvasObject={(link, ctx, globalScale) => {
                            const start = link.source;
                            const end = link.target;
                            if (typeof start !== 'object' || typeof end !== 'object') return;

                            const isHighlit = highlightNode &&
                                ((start.id ?? start) === highlightNode || (end.id ?? end) === highlightNode);

                            // Draw Line
                            ctx.beginPath();
                            ctx.moveTo(start.x, start.y);
                            ctx.lineTo(end.x, end.y);
                            ctx.lineWidth = isHighlit ? 2.5 / globalScale : 1.5 / globalScale;
                            ctx.strokeStyle = isHighlit ? '#818cf8' : 'rgba(99,102,241,0.25)';
                            ctx.stroke();

                            // Arrow head
                            const angle = Math.atan2(end.y - start.y, end.x - start.x);
                            const arrowLen = 10 / globalScale;
                            ctx.beginPath();
                            ctx.moveTo(end.x, end.y);
                            ctx.lineTo(
                                end.x - arrowLen * Math.cos(angle - Math.PI / 6),
                                end.y - arrowLen * Math.sin(angle - Math.PI / 6)
                            );
                            ctx.lineTo(
                                end.x - arrowLen * Math.cos(angle + Math.PI / 6),
                                end.y - arrowLen * Math.sin(angle + Math.PI / 6)
                            );
                            ctx.closePath();
                            ctx.fillStyle = isHighlit ? '#818cf8' : 'rgba(99,102,241,0.6)';
                            ctx.fill();

                            // Show label only when zoomed in somewhat, to avold clutter
                            if (globalScale < 0.8) return;

                            const label = (link.label || link.type || '').replace(/_/g, ' ');
                            if (!label) return;

                            const relLink = { x: end.x - start.x, y: end.y - start.y };
                            const len = Math.sqrt(relLink.x ** 2 + relLink.y ** 2);
                            const fontSize = Math.max(5, 12 / globalScale);
                            ctx.font = `600 ${fontSize}px Inter, sans-serif`;
                            const textWidth = ctx.measureText(label).width;

                            if (len < textWidth + 15) return;

                            const textPos = { x: start.x + relLink.x * 0.5, y: start.y + relLink.y * 0.5 };
                            const textAngle = Math.atan2(relLink.y, relLink.x);
                            
                            ctx.save();
                            ctx.translate(textPos.x, textPos.y);
                            // Keep text upright
                            ctx.rotate(textAngle > Math.PI / 2 || textAngle < -Math.PI / 2 ? textAngle + Math.PI : textAngle);

                            // Create the "gap" effect for text
                            // By drawing a background-colored rectangle behind text
                            ctx.fillStyle = 'rgba(248, 250, 252, 0.9)'; // the background color
                            ctx.fillRect(-textWidth / 2 - 4, -fontSize / 2 - 2, textWidth + 8, fontSize + 4);

                            // Floating text
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = isHighlit ? '#4f46e5' : '#818cf8'; 
                            ctx.fillText(label, 0, 0);
                            ctx.restore();
                        }}
                        backgroundColor="transparent"
                        width={undefined}
                        height={undefined}
                        cooldownTicks={100}
                        onEngineStop={() => fgRef.current?.zoomToFit(400, 40)}
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🕸️</div>
                            {virusName ? 'Building Knowledge Graph...' : 'Ready to Analyze'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GraphViz;
