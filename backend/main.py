from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from scraper import fetch_papers
from nlp_model import analyze_batch
from graph_db import BioGraphDB
import time
import json
import asyncio

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
try:
    graph_db = BioGraphDB("neo4j+s://81767515.databases.neo4j.io", "neo4j", "utSBg1cWvOQgEPnJf_DWfcsFIT4UlCmQQ1Jo1S2MN3M")
except Exception as e:
    print(f"Skipping DB connection due to error: {e}")
    # Dummy mock
    class MockDB:
        driver = None
        def add_interaction(self, *args, **kwargs): pass
    graph_db = MockDB()

@app.get("/")
def home():
    """
    Health check endpoint.
    Returns the status of the API and the graph database connection.
    """
    return {
        "status": "BioScan Engine Online", 
        "graph_connection": graph_db.driver is not None
    }

@app.get("/scan/{virus_name}")
async def scan_virus(virus_name: str, limit: int = 50):
    """
    Orchestrates the virus scanning process:
    1. Fetches research papers from PubMed.
    2. Analyzes text using NLP to find drug interactions.
    3. Updates the Neo4j Knowledge Graph.
    4. Streams progress updates to the client.
    """
    async def process_stream():
        start_time = time.time()
        
        try:
            # 1. Research Phase
            yield json.dumps({"status": "progress", "percent": 10, "stage": "Connecting to PubMed..."}) + "\n"
            await asyncio.sleep(0.5) # UX pause
            
            yield json.dumps({"status": "progress", "percent": 30, "stage": f"Fetching {limit} papers..."}) + "\n"
            papers = fetch_papers(virus_name, limit=limit)
            
            if not papers:
                yield json.dumps({"status": "error", "message": "No papers found on PubMed."}) + "\n"
                return

            # 2. Analysis Phase
            yield json.dumps({"status": "progress", "percent": 50, "stage": "Analyzing medical text for interactions..."}) + "\n"
            results = analyze_batch(papers)
            
            # 3. Output Phase
            yield json.dumps({"status": "progress", "percent": 80, "stage": "Constructing Knowledge Graph..."}) + "\n"
            
            if graph_db.driver and results:
                for paper in results:
                    for match in paper['matches']:
                        graph_db.add_interaction(
                            drug=match['drug'], 
                            virus=virus_name, 
                            paper_title=paper['title'], 
                            evidence=match['context'],
                            pmid=paper.get('pmid')
                        )

            duration = round(time.time() - start_time, 2)
            
            final_response = {
                "status": "complete",
                "data": {
                    "target": virus_name,
                    "scanned_count": len(papers),
                    "relevant_findings": len(results),
                    "execution_time": f"{duration}s",
                    "data": results
                }
            }
            yield json.dumps(final_response) + "\n"
            
        except Exception as e:
            # Catch-all for unexpected errors during stream
            print(f"Error during scan: {e}")
            yield json.dumps({"status": "error", "message": f"An unexpected error occurred: {str(e)}"}) + "\n"

    return StreamingResponse(process_stream(), media_type="application/x-ndjson")

@app.get("/graph/{virus_name}")
def get_graph(virus_name: str):
    """
    Returns the graph structure (nodes/links) for the requested virus.
    Used by the frontend ForceGraph2D component.
    """
    if not graph_db.driver:
        return {"nodes": [], "links": []}
        
    return graph_db.get_virus_graph(virus_name)

@app.get("/data/{virus_name}")
def get_data(virus_name: str):
    """
    Returns detailed drug-virus interaction data from the database.
    Used for the tabular data view.
    """
    if not graph_db.driver:
        return []
        
    return graph_db.get_virus_data(virus_name)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)