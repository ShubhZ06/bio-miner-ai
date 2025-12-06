from graph_db import BioGraphDB

# Credentials from main.py
graph_db = BioGraphDB("neo4j+s://81767515.databases.neo4j.io", "neo4j", "utSBg1cWvOQgEPnJf_DWfcsFIT4UlCmQQ1Jo1S2MN3M")

def check_case_insensitive():
    if not graph_db.driver:
        print("Failed to connect to DB")
        return

    print("Testing case-insensitive fetch...")
    
    # Test 1: Exact match (control)
    print("\n--- Test 1: Exact Match 'dengue virus' ---")
    data_exact = graph_db.get_virus_data("dengue virus")
    print(f"Result count: {len(data_exact)}")

    # Test 2: Case mismatch
    print("\n--- Test 2: Case Mismatch 'Dengue Virus' ---")
    data_case = graph_db.get_virus_data("Dengue Virus")
    print(f"Result count: {len(data_case)}")

    # Test 3: Partial match
    print("\n--- Test 3: Partial Match 'dengue' ---")
    data_partial = graph_db.get_virus_data("dengue")
    print(f"Result count: {len(data_partial)}")

    graph_db.close()

if __name__ == "__main__":
    check_case_insensitive()
