🧬 Project Manifest: BioScan AI Engine

Target Environment: Google Antigravity (Agentic IDE)
Hardware Context: Local Execution (NVIDIA RTX 4060 GPU Detected)

1. Project Identity & Mission

BioScan is an automated drug repurposing engine. It scrapes biomedical literature (PubMed), uses dual-model NLP to extract Drug-Virus interactions, and constructs a Knowledge Graph (Neo4j) to visualize hidden connections.

Core Logic:

Ingest: Fetch abstracts from PubMed.

Analyze: Use BioBERT-Chemical + BioBERT-Disease to find entities.

Filter: Apply heuristic logic (Co-occurrence + Keyword Match) to valid interactions.

Graph: Store findings in Neo4j (Drug -> Virus).

2. Architecture & Constraints (CRITICAL FOR AGENTS)

🛑 Agent Boundaries (DO NOT MODIFY WITHOUT APPROVAL)

Dual-Model Setup (backend/nlp_model.py): We use two separate BERT pipelines (one for Chemicals, one for Diseases). Do not consolidate these into a single model; precision will drop.

GPU Batching: The analyze_batch function uses batch_size=32 and abstract[:512] truncation. Do not remove truncation; it will cause CUDA OOM errors on the RTX 4060.

Scraper Resilience (backend/scraper.py): The safe_get utility is mandatory. PubMed XML structure varies wildly; removing this utility will cause production crashes.

Database Credentials: The codebase expects a local Neo4j instance at bolt://localhost:7687 with neo4j/password123.

Tech Stack

Backend: Python 3.9+ (FastAPI, Uvicorn)

AI/ML: PyTorch (CUDA), HuggingFace Transformers

Database: Neo4j (Graph DB), Biopython (Entrez API)

Frontend: React.js (Create React App)

3. Operational Commands (For Agent Execution)

The agent should use these commands to run and verify the application.

1. Install Dependencies

pip install -r requirements.txt
cd frontend && npm install


2. Start Backend (Terminal A)
Must be run from root or backend/ folder.

cd backend
uvicorn main:app --reload


Success Signal: ⚡ [AI Engine] Loading Models on: NVIDIA GeForce RTX 4060

3. Start Frontend (Terminal B)

cd frontend
npm start


Success Signal: Browser opens at http://localhost:3000.

4. Neo4j Verification (Cypher)
To verify data insertion, run this in Neo4j Browser:

MATCH (d:Drug)-[r:POTENTIAL_CANDIDATE]->(v:Virus) RETURN d, r, v LIMIT 25


4. Directory Map (Context)

AVISKAR/
├── backend/
│   ├── main.py          # API Gateway (FastAPI) & Graph DB Connection
│   ├── nlp_model.py     # The "Brain" (Dual-BERT + Blacklist Logic)
│   ├── scraper.py       # PubMed Data Ingestion (Recursive XML parsing)
│   └── graph_db.py      # Neo4j Connector Class
├── frontend/
│   ├── src/
│   │   ├── App.js       # Main Dashboard UI
│   │   └── ...
│   └── package.json
├── requirements.txt     # Python Dependencies
└── PROJECT_MANIFEST.md  # This file


5. Development Roadmap (Agent Tasks)

Current Phase: MVP Complete (Dual-BERT + Graph).

Next Agent Objectives (In Order):

Refactor Graph Schema: Update backend/graph_db.py to include "Paper" nodes explicitly, linking (Drug)-[:MENTIONED_IN]->(Paper).

Frontend Visualization: Replace the text list in React with a visual graph library (e.g., react-force-graph) to show the node network in the browser.

Molecular Validation (Future): Integrate rdkit to check if the found Drug actually has a molecular weight compatible with viral protein pockets.