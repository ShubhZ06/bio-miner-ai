import React, { useState } from 'react';

function App() {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(50);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setResults(null);
    setError(null);
    
    try {
      // Connect to Backend
      const response = await fetch(`http://127.0.0.1:8000/scan/${query}?limit=${limit}`);
      const data = await response.json();
      
      if (data.status === "empty") {
        setError("No papers found. Try a different virus name.");
      } else {
        setResults(data);
      }
    } catch (err) {
      setError("Failed to connect to backend. Is the Python server running?");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Segoe UI, sans-serif", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      
      {/* Header Section */}
      <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ color: "#2c3e50", marginBottom: "10px", fontSize: "2.5rem" }}>🧬 BioScan: In-Silico Drug Discovery</h1>
        <p style={{ color: "#7f8c8d", fontSize: "1.1rem" }}>Deep literature mining using <b>BioBERT & Knowledge Graphs</b></p>
        
        <div style={{ background: "white", padding: "30px", borderRadius: "15px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", marginTop: "30px" }}>
          <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
            <input 
              type="text" 
              placeholder="Enter Target (e.g., Dengue Virus)" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ padding: "15px", width: "50%", border: "2px solid #e1e4e8", borderRadius: "8px", fontSize: "16px", outline: "none" }}
            />
            <select 
              value={limit} 
              onChange={(e) => setLimit(e.target.value)}
              style={{ padding: "15px", border: "2px solid #e1e4e8", borderRadius: "8px", fontSize: "16px", backgroundColor: "#fff" }}
            >
              <option value="10">Scan 10 Papers</option>
              <option value="50">Scan 50 Papers</option>
              <option value="100">Scan 100 Papers</option>
              <option value="200">Scan 200 Papers</option>
            </select>
            <button 
              onClick={handleSearch} 
              disabled={loading}
              style={{ 
                padding: "15px 30px", 
                backgroundColor: loading ? "#95a5a6" : "#3498db", 
                color: "white", 
                border: "none", 
                borderRadius: "8px", 
                cursor: loading ? "not-allowed" : "pointer", 
                fontWeight: "bold",
                fontSize: "16px",
                transition: "all 0.3s ease"
              }}
            >
              {loading ? "Processing..." : "Start Analysis"}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {error && (
        <div style={{ maxWidth: "900px", margin: "20px auto", padding: "15px", backgroundColor: "#fee2e2", color: "#c0392b", borderRadius: "8px", textAlign: "center", border: "1px solid #f5c6cb" }}>
          ⚠️ {error}
        </div>
      )}

      {results && (
        <div style={{ maxWidth: "900px", margin: "30px auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", color: "#555", backgroundColor: "#fff", padding: "15px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <span>Target: <b>{results.target}</b></span>
            <span>Scanned: <b>{results.scanned_count}</b> papers</span>
            <span>Findings: <b>{results.relevant_findings}</b></span>
            <span>GPU Time: <b>{results.execution_time}</b></span>
          </div>

          {results.data.map((paper, index) => (
            <div key={index} style={{ background: "white", padding: "25px", marginBottom: "20px", borderRadius: "12px", borderLeft: "6px solid #2ecc71", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 15px 0", fontSize: "20px", color: "#2c3e50", lineHeight: "1.4" }}>{paper.title}</h3>
              
              <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "8px" }}>
                {paper.matches.map((match, i) => (
                  <div key={i} style={{ marginBottom: "15px", paddingBottom: "15px", borderBottom: i === paper.matches.length - 1 ? "none" : "1px solid #eee" }}>
                    <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ backgroundColor: "#e8f6f3", color: "#16a085", padding: "6px 12px", borderRadius: "20px", fontWeight: "bold", fontSize: "14px", border: "1px solid #a3e4d7" }}>
                        💊 {match.drug}
                      </span>
                      <span style={{ fontSize: "12px", color: "#95a5a6" }}>Confidence: {match.confidence}</span>
                    </div>
                    <p style={{ margin: "0", fontSize: "15px", color: "#555", fontStyle: "italic", lineHeight: "1.6" }}>
                      "{match.context}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;