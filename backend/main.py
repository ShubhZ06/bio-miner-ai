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
# Ensure Neo4j Desktop is running with these credentials
graph_db = BioGraphDB("bolt://localhost:7687", "neo4j", "password123")

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