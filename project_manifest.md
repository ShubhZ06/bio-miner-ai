Project Manifest: BioScan In-Silico Drug Repurposing Engine

1. Executive Summary

Project Name: BioScan AI Engine
Domain: Computational Biology / NLP / Drug Discovery
Status: MVP (GPU-Accelerated Prototype)

Core Mission: To automate the discovery of existing FDA-approved drugs that can be repurposed to treat neglected viral diseases (specifically Flaviviridae family: Dengue, Zika, etc.) by mining vast amounts of unstructured biomedical literature.

2. Motivation & Problem Statement

The Problem

Data Overload: There are over 30 million papers in PubMed. No human researcher can cross-reference all of them to find obscure connections between existing drugs and new viral targets.

Time-to-Market: Developing a new drug takes 10-15 years.

The "Hidden Link": A drug might be known to inhibit "Protein X" in a cancer study, and "Protein X" might be vital for "Zika Virus" replication. These two facts often exist in separate papers, unconnected until now.

The Solution

An automated NLP Pipeline that:

Ingests thousands of abstracts from PubMed in real-time.

Uses Domain-Specific AI (BioBERT) to "read" and understand biological entities.

Applies heuristic logic to identify valid interactions (e.g., "Chloroquine inhibits autophagy").

Outputs a ranked list of drug candidates for immediate review.

3. System Architecture

A. The Data Pipeline (Ingestion)

Source: PubMed (NCBI Entrez API).

Tooling: Biopython.

Strategy: * Batch processing (chunks of 50-100 papers) to respect API rate limits.

Recursive XML parsing to handle inconsistent metadata structures.

Defensive error handling (skips malformed records without crashing).

B. The AI Engine (The "Brain")

Hardware context: Optimized for NVIDIA RTX 4060 (8GB VRAM).

Models: Dual-Model Architecture using HuggingFace Transformers.

Chemical/Drug NER: alvaroalon2/biobert_chemical_ner (Trained on BC5CDR).

Disease/Virus NER: ugaray96/biobert_ncbi_disease_ner (Trained on NCBI Disease).

Inference Strategy:

GPU Batching: Processes papers in batches of 32 to maximize CUDA core usage.

Truncation: Abstracts limited to 512 tokens to fit BERT architecture constraints.

C. The Logic Layer (Heuristic Filtering)

We do not rely solely on NER. We use Context-Aware Filtering:

Sentence Splitting: Abstracts are broken into individual sentences.

Co-occurrence Check: A detection is valid ONLY if:

A Drug Entity is found.

An Interaction Keyword is present in the same sentence (e.g., "inhibit", "block", "treat", "bind").

Evidence Extraction: The specific sentence triggering the match is preserved as "evidence" for the user.

4. Technology Stack

Component

Technology

Reasoning

Backend

Python 3.9+, FastAPI

High performance, native async support for heavy ML tasks.

ML Framework

PyTorch (CUDA)

Essential for GPU acceleration of BERT models.

NLP Library

HuggingFace Transformers

Standard for state-of-the-art pre-trained models.

Frontend

React.js

fast, reactive UI for displaying real-time scan results.

Data Source

PubMed (XML/API)

The gold standard for biomedical literature.

5. Current Implementation Details (For Developers)

Critical Files

backend/scraper.py: Handles the Entrez connection. Contains safe_get utility for XML parsing.

backend/nlp_model.py: Loads the Two BioBERT pipelines. Contains the analyze_batch function and the INTERACTION_KEYWORDS list.

backend/main.py: The entry point. Manages the flow: Request -> Scrape -> Analyze -> Response.

Optimization Flags

DEVICE = 0: Code explicitly checks for torch.cuda.is_available().

BATCH_SIZE = 32: Tuned for 8GB VRAM to prevent OOM (Out of Memory) errors.

6. Roadmap & Future Goals

Knowledge Graph Integration (Neo4j):

Current: Linear list of findings.

Goal: Store relationships as Nodes/Edges (Drug)-[:INHIBITS]->(Virus) to find indirect paths (Drug A -> Protein B -> Virus C).

Full Text Parsing:

Move beyond abstracts to parse full PDF/PMC XML content for deeper insights.

ChemInformatics:

Integrate molecular docking scores (using RDKit) to validate if the found drug actually fits the viral protein.