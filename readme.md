🧬 BioScan: AI-Powered Drug Repurposing Engine
==============================================

**BioScan** is an automated, high-performance in-silico drug discovery engine. It mines thousands of biomedical research papers in real-time to uncover hidden relationships between existing FDA-approved drugs and viral targets (focusing on Flaviviridae: Dengue, Zika, etc.).

🚀 The Problem & Solution
-------------------------

**The Gap:** With over 30 million papers in PubMed, finding obscure connections between a drug used for one disease and a protein structure in a new virus is a massive "needle in a haystack" problem for human researchers.

**Our Solution:** An autonomous pipeline that:

1.  **Ingests** abstracts from PubMed using the Entrez API.
    
2.  **Reads** text using **Dual-BioBERT models** (one for Chemicals, one for Diseases) to perform precise Named Entity Recognition (NER).
    
3.  **Filters** findings using sentence-level context logic and molecular interaction keywords.
    
4.  **Constructs** a Knowledge Graph (Neo4j) to visualize valid (Drug)-\[:POTENTIAL\_CANDIDATE\]->(Virus) relationships.
    

⚙️ Technical Architecture
-------------------------

### 1\. The "Brain" (NLP Engine)

*   **Dual-Model Approach:** We utilize two distinct HuggingFace Transformers:
    
    *   alvaroalon2/biobert\_chemical\_ner: For precise drug/chemical extraction.
        
    *   ugaray96/biobert\_ncbi\_disease\_ner: For virus/disease validation.
        
*   **GPU Acceleration:** Optimized for local NVIDIA GPUs (RTX 4060) using PyTorch CUDA tensors. It processes papers in batches of 32 for maximum throughput.
    

### 2\. The Knowledge Graph

*   **Neo4j Database:** Stores findings as a graph network.
    
*   **Nodes:** Drug, Virus, Paper.
    
*   **Edges:** POTENTIAL\_CANDIDATE (with confidence scores), MENTIONED\_IN (linking back to source evidence).
    

### 3\. The Data Pipeline

*   **Scraper:** Custom recursive XML parser built on Biopython to handle inconsistent PubMed metadata.
    
*   **Resilience:** Implements retry logic and polite backoff to respect NCBI API rate limits.
    

🛠️ Tech Stack
--------------

*   **Backend:** Python 3.9+, FastAPI, Uvicorn
    
*   **AI/ML:** PyTorch, Transformers (HuggingFace), BioBERT
    
*   **Database:** Neo4j (Graph DB)
    
*   **Frontend:** React.js, Axios
    
*   **Data Source:** PubMed (NCBI Entrez)
    

🏁 Getting Started
------------------

### Prerequisites

*   **Python 3.9+** installed.
    
*   **Node.js & npm** installed.
    
*   **Neo4j Desktop** installed and running.
    
*   _(Optional but Recommended)_ NVIDIA GPU with CUDA drivers.
    

### 1\. Clone the Repository

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   git clone [https://github.com/yourusername/BioScan.git](https://github.com/yourusername/BioScan.git)  cd BioScan   `

### 2\. Database Setup

1.  Open **Neo4j Desktop**.
    
2.  Create a Local DBMS named BioScanDB.
    
3.  Set password to password123 (or update backend/main.py with your credentials).
    
4.  Start the database.
    

3\. Backend Setup

\# Navigate to backend

cd backend

  

\# Install dependencies

pip install -r requirements.txt

  

\# Run the API Server

uvicorn main:app --reload

You should see: ⚡ \[AI Engine\] Loading Models on: NVIDIA GeForce RTX...

  

4\. Frontend Setup

\# Open a new terminal

cd frontend

  

\# Install dependencies

npm install

  

\# Start the React Dashboard

npm start

The app will launch at http://localhost:3000

  

🧪 Usage

Open the web dashboard.

Enter a viral target (e.g., "Dengue Virus").

Select the number of papers to scan (e.g., 50).

Click "Start Analysis".

Watch the logs as the GPU crunches through literature.

View Results:

On Screen: See a ranked list of drugs with the exact sentence context ("evidence").

In Neo4j: Open Neo4j Browser and run MATCH (n) RETURN n to see the knowledge graph grow in real-time.

🔮 Roadmap

\[x\] MVP: Real-time scraping & NLP Analysis

\[x\] GPU Acceleration & Batch Processing

\[x\] Knowledge Graph Integration (Neo4j)

\[ \] Advanced Graph Schema: Link Papers explicitly to authors and journals.

\[ \] Frontend Graph Viz: Implement react-force-graph for 3D network exploration in the browser.

\[ \] Molecular Validation: Integrate RDKit to validate molecular weight and druggability.

📜 License

Distributed under the MIT License. See LICENSE for more information.

Built with ❤️ and ☕ by \[Shubham Gupta,Aryan Yadav,Om Telgade\]