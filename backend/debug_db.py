from graph_db import BioGraphDB

# Credentials from main.py
graph_db = BioGraphDB("neo4j+s://81767515.databases.neo4j.io", "neo4j", "utSBg1cWvOQgEPnJf_DWfcsFIT4UlCmQQ1Jo1S2MN3M")

def check_contents():
    if not graph_db.driver:
        print("Failed to connect to DB")
        return

    with graph_db.driver.session() as session:
        # Check available viruses
        result = session.run("MATCH (v:Virus) RETURN v.name as name")
        viruses = [record["name"] for record in result]
        print(f"Found {len(viruses)} viruses in DB: {viruses}")
        
        if viruses:
            test_virus = viruses[0]
            print(f"Testing fetch for '{test_virus}'...")
            data = graph_db.get_virus_data(test_virus)
            print(f"Result count: {len(data)}")
            if data:
                print("Sample data:", data[0])
        else:
            print("No viruses found. DB might be empty.")

    graph_db.close()

if __name__ == "__main__":
    check_contents()
