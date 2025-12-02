# 🧬 BioScan: AI-Powered Drug Repurposing Engine

**BioScan** is an automated, high-performance *in-silico drug discovery engine*.  
It mines thousands of biomedical research papers in real time to uncover hidden relationships between **FDA-approved drugs** and **viral targets** (with a focus on *Flaviviridae*: Dengue, Zika, etc.).

---

## 🚀 Problem & Solution

### **The Gap**
With over **30 million** papers in PubMed, finding obscure relationships between:
- a drug used for one disease, and  
- a protein structure in a new virus  

…is a massive *“needle in a haystack”* problem for human researchers.

### **Our Solution**
BioScan provides an autonomous AI-driven pipeline that:

- Ingests abstracts from **PubMed** via the Entrez API  
- Reads text using **Dual-BioBERT NER models**  
  - Chemical NER (drug extraction)  
  - Disease/virus NER (target validation)  
- Filters relevant sentences using **context rules + molecular interaction keywords**  
- Builds a **Neo4j Knowledge Graph** mapping  
  **(Drug) –[:POTENTIAL_CANDIDATE]→ (Virus)**  
  with evidence and confidence scores.

---

## ⚙️ Technical Architecture

### **1. The Brain (NLP Engine)**

#### **Dual-Model Approach**
Two HuggingFace BioBERT Transformers:

- `alvaroalon2/biobert_chemical_ner` — Extracts chemicals/drugs  
- `ugaray96/biobert_ncbi_disease_ner` — Extracts disease/virus entities  

#### **GPU Acceleration**
- Optimized for NVIDIA GPUs (e.g., **RTX 4060**)  
- Runs on **PyTorch CUDA**  
- Batch size: **32 papers per inference cycle**

---

### **2. Knowledge Graph Layer**

**Neo4j Graph Database**

- **Nodes:** Drug, Virus, Paper  
- **Edges:**  
  - `POTENTIAL_CANDIDATE` (with confidence score)  
  - `MENTIONED_IN` (links findings to source literature)

Real-time visualization through Neo4j Browser.

---

### **3. Data Pipeline**

- Custom recursive **XML parser** using **Biopython**  
- Handles inconsistent PubMed metadata  
- Built-in **retry logic & polite rate limiting** to satisfy NCBI requirements  

---

## 🛠️ Tech Stack

| Component | Technology |
|----------|------------|
| **Backend** | Python 3.9+, FastAPI, Uvicorn |
| **AI/ML** | PyTorch, HuggingFace Transformers, BioBERT |
| **Database** | Neo4j |
| **Frontend** | React.js, Axios |
| **Data Source** | PubMed (NCBI Entrez API) |

---

## 🏁 Getting Started

### **Prerequisites**
- Python **3.9+**  
- Node.js & npm  
- Neo4j Desktop  
- (Optional) NVIDIA GPU with CUDA for faster inference  

---

### **1. Clone the Repository**

```bash
git clone https://github.com/yourusername/BioScan.git
cd BioScan
