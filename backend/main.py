from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scraper import fetch_papers
from nlp_model import analyze_batch
from graph_db import BioGraphDB
import time

# --- APP SETUP ---
app = FastAPI(title="BioScan AI Engine", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE SETUP ---
# Initialize Neo4j Connection
# Using Neo4j Aura Instance
graph_db = BioGraphDB("neo4j+s://81767515.databases.neo4j.io", "neo4j", "utSBg1cWvOQgEPnJf_DWfcsFIT4UlCmQQ1Jo1S2MN3M")

@app.get("/")
def home():
    return {
        "status": "BioScan Engine Online", 
        "graph_connection": graph_db.driver is not None
    }

@app.get("/scan/{virus_name}")
def scan_virus(virus_name: str, limit: int = 50):
    start_time = time.time()
    
    print(f"--- Request: Scan {limit} papers for {virus_name} ---")
    
    # 1. Fetch Data
    papers = fetch_papers(virus_name, limit=limit)
    
    if not papers:
        return {"status": "empty", "message": "No papers found on PubMed."}

    # 2. Analyze (GPU Accelerated)
    results = analyze_batch(papers)
    
    # 3. Save to Graph (Knowledge Persistence)
    if graph_db.driver and results:
        print(f"   ...Pushing {len(results)} findings to Neo4j...")
        for paper in results:
            for match in paper['matches']:
                graph_db.add_interaction(
                    drug=match['drug'], 
                    virus=virus_name, 
                    paper_title=paper['title'], 
                    evidence=match['context']
                )

    duration = round(time.time() - start_time, 2)
    
    return {
        "target": virus_name,
        "scanned_count": len(papers),
        "relevant_findings": len(results),
        "execution_time": f"{duration}s",
        "data": results
    }

@app.get("/graph/{virus_name}")
def get_graph(virus_name: str):
    """
    Returns the graph structure (nodes/links) for the requested virus.
    """
    if not graph_db.driver:
        return {"nodes": [], "links": []}
        
    return graph_db.get_virus_graph(virus_name)

@app.get("/data/{virus_name}")
def get_data(virus_name: str):
    """
    Returns detailed drug-virus interaction data from the database.
    """
    if not graph_db.driver:
        return []
        
    return graph_db.get_virus_data(virus_name)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)