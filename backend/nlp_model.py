import torch
from transformers import pipeline
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- GPU SETUP ---
# Explicitly checks for NVIDIA GPU availability
DEVICE = 0 if torch.cuda.is_available() else -1
device_name = torch.cuda.get_device_name(0) if DEVICE == 0 else "CPU"
print(f"⚡ [AI Engine] Loading Models on: {device_name}")

# --- MODEL LOADING ---
# We use DUAL MODELS to ensure high precision.
try:
    # Model 1: Specific for Chemicals (Drugs)
    logger.info("Loading Chemical BERT...")
    chemical_pipeline = pipeline(
        "ner", 
        model="alvaroalon2/biobert_chemical_ner", 
        aggregation_strategy="simple", 
        device=DEVICE
    )
    # Model 2: Specific for Diseases (Validation)
    logger.info("Loading Disease BERT...")
    disease_pipeline = pipeline(
        "ner", 
        model="ugaray96/biobert_ncbi_disease_ner", 
        aggregation_strategy="simple", 
        device=DEVICE
    )
except Exception as e:
    logger.error(f"Failed to load models. Check internet connection: {e}")
    exit(1)

# --- FILTERING LOGIC ---

# 1. Interaction Keywords: Words that imply a relationship
INTERACTION_KEYWORDS = [
    "inhibit", "block", "reduce", "suppress", "antiviral", "treat", "prevent", 
    "bind", "target", "activity", "effective", "potential", "candidate", "derivative",
    "downregulate", "antagonist", "interaction"
]

# 2. Blacklist: Common biological noise to filter out
BLACKLIST = {
    "carbon", "water", "solution", "buffer", "protein", "virus", "drug", 
    "patient", "study", "result", "fatty acyl", "cholesteryl ester", 
    "pyrethroid", "mosquito", "vector", "control", "analysis", "data",
    "method", "gene", "expression", "assay", "compound", "agent", "elements",
    "oxygen", "hydrogen", "glucose", "saline", "dmso", "placebo"
}

def split_into_sentences(text):
    """Splits text into sentences to establish local context."""
    # Look for periods followed by a space and a capital letter, ensuring we don't split "E. coli"
    return re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)

def analyze_batch(papers_list):
    """
    Main Logic Pipeline:
    1. Receive papers
    2. Batch process abstracts on GPU to find Chemicals
    3. Filter results using Blacklist
    4. Validate results using Context Matching (Sentence Level)
    """
    if not papers_list: 
        return []

    # Prepare inputs (Truncate to 512 tokens for BERT speed compliance)
    abstracts = [p['abstract'][:512] for p in papers_list] 
    
    logger.info(f"Running inference on {len(abstracts)} abstracts...")
    
    # Batch Inference
    chemical_results = chemical_pipeline(abstracts, batch_size=32)
    
    analyzed_data = []

    for i, paper in enumerate(papers_list):
        text = paper['abstract']
        sentences = split_into_sentences(text)
        
        # --- LOGIC STEP 1: Entity Extraction & Filtering ---
        found_chemicals = set()
        for c in chemical_results[i]:
            word = c['word'].lower().strip()
            # Heuristic: Must be >3 chars, high confidence, and NOT in blacklist
            if c['score'] > 0.85 and len(word) > 3 and word not in BLACKLIST:
                # Store original casing from text if possible, or just the word
                found_chemicals.add(c['word']) 
        
        valid_connections = []

        # --- LOGIC STEP 2: Contextual Validation ---
        for sentence in sentences:
            sent_lower = sentence.lower()
            
            # Check if this sentence discusses an Interaction
            if any(kw in sent_lower for kw in INTERACTION_KEYWORDS):
                # Check if any identified chemical is in this specific sentence
                for chemical in found_chemicals:
                    if chemical in sentence:
                        valid_connections.append({
                            "drug": chemical,
                            "context": sentence, # Evidence
                            "confidence": "High"
                        })

        if valid_connections:
            analyzed_data.append({
                "pmid": paper.get('pmid'),
                "title": paper['title'],
                "matches": valid_connections
            })
            
    return analyzed_data