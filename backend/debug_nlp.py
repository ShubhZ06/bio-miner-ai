from nlp_model import analyze_batch, chemical_pipeline

# Sample text with a known drug (Chloroquine) and virus (Dengue) interaction
sample_text = """
Chloroquine has been shown to inhibit Dengue virus replication in vitro. 
The study demonstrates that Chloroquine is an effective antiviral agent against Flaviviruses.
"""

print("--- Debugging NLP Model ---")

# 1. Direct Pipeline Check
print("\n1. Running Raw Pipeline on sample text...")
raw_results = chemical_pipeline(sample_text)
print(f"Raw Results: {raw_results}")

# 2. Full Analysis Logic Check
print("\n2. Running analyze_batch on sample text...")
papers = [{"title": "Debug Paper", "abstract": sample_text}]
results = analyze_batch(papers)

if results:
    print("\n✅ Success! Found interactions:")
    for r in results:
        print(r)
else:
    print("\n❌ Failed! No interactions found.")
