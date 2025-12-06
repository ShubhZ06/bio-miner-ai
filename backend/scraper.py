from Bio import Entrez
import time
import logging

# --- CONFIGURATION ---
# REQUIRED: Replace with your actual email to comply with NCBI policies
Entrez.email = "shubhamgupta73110@gmail.com" 
BATCH_SIZE = 50

# Setup robust logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def safe_get(dictionary, keys, default=None):
    """
    Recursively retrieves nested keys from a dictionary.
    Eliminates KeyError crashes when XML structure varies.
    """
    for key in keys:
        try:
            dictionary = dictionary[key]
        except (KeyError, TypeError, IndexError):
            return default
    return dictionary

def fetch_papers(keyword, limit=50):
    """
    Fetches papers from PubMed with:
    1. Retry logic (network resilience)
    2. Batch processing (API rate limit compliance)
    3. Recursive parsing (Data structure resilience)
    """
    logger.info(f"🚀 [Scraper] Searching PubMed for: '{keyword}' (Limit: {limit})...")
    
    try:
        # 1. Search for IDs
        # We try 3 times before giving up to handle transient network issues
        for attempt in range(3):
            try:
                handle = Entrez.esearch(db="pubmed", term=keyword, retmax=limit)
                record = Entrez.read(handle)
                handle.close()
                break
            except Exception as e:
                if attempt == 2: raise e
                logger.warning(f"Search timeout. Retrying ({attempt+1}/3)...")
                time.sleep(2)

        id_list = record.get("IdList", [])
        if not id_list:
            logger.warning("No papers found for this query.")
            return []

        logger.info(f"✅ Found {len(id_list)} IDs. Fetching details...")
        papers = []

        # 2. Fetch Details in Batches
        # Processing in chunks prevents the 'Response too large' error
        seen_pmids = set()
        for i in range(0, len(id_list), BATCH_SIZE):
            chunk = id_list[i:i + BATCH_SIZE]
            
            try:
                handle = Entrez.efetch(db="pubmed", id=chunk, retmode="xml")
                records = Entrez.read(handle)
                handle.close()
                
                for article in records['PubmedArticle']:
                    try:
                        citation = article['MedlineCitation']
                        
                        # 1. Identify Uniqueness (PMID)
                        pmid = str(citation['PMID'])
                        if pmid in seen_pmids:
                            continue
                        seen_pmids.add(pmid)

                        article_data = citation['Article']
                        title = article_data.get('ArticleTitle', 'No Title')
                        
                        # Robust Abstract Extraction
                        # Handles cases where abstract is a list (structured) or string (unstructured)
                        abstract_raw = safe_get(article_data, ['Abstract', 'AbstractText'], [])
                        if isinstance(abstract_raw, list):
                            abstract = " ".join([str(x) for x in abstract_raw])
                        else:
                            abstract = str(abstract_raw)

                        # Logic: Only keep papers with substantial content
                        if abstract and len(abstract) > 50: 
                            papers.append({"pmid": pmid, "title": title, "abstract": abstract})
                            
                    except Exception:
                        continue # Skip malformed records silently
                        
            except Exception as e:
                logger.error(f"Batch fetch failed: {e}")
                time.sleep(1) # Polite backoff
                
        logger.info(f"✅ Successfully extracted {len(papers)} unique, valid abstracts.")
        return papers

    except Exception as e:
        logger.critical(f"Critical Scraper Error: {e}")
        return []