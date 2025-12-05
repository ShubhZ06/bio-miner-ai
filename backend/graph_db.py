from neo4j import GraphDatabase
import logging

logger = logging.getLogger(__name__)

class BioGraphDB:
    """
    Handles all interactions with the Neo4j Graph Database.
    Implements connection pooling and transaction management.
    """
    def __init__(self, uri, user, password):
        self.driver = None
        try:
            self.driver = GraphDatabase.driver(uri, auth=(user, password))
            self.driver.verify_connectivity()
            logger.info("✅ Connected to Neo4j Graph Database")
        except Exception as e:
            logger.warning(f"⚠️ Failed to connect to Neo4j: {e}")

    def close(self):
        if self.driver:
            self.driver.close()

    def add_interaction(self, drug, virus, paper_title, evidence):
        """
        Creates the following graph structure:
        (Drug)-[:POTENTIAL_CANDIDATE]->(Virus)
        (Drug)-[:MENTIONED_IN]->(Paper)
        """
        if not self.driver:
            return

        with self.driver.session() as session:
            try:
                session.execute_write(self._create_nodes, drug, virus, paper_title, evidence)
            except Exception as e:
                logger.error(f"❌ Graph Write Error: {e}")

    @staticmethod
    def _create_nodes(tx, drug, virus, title, evidence):
        # Cypher Query: Merge ensures we don't create duplicates
        query = (
            "MERGE (d:Drug {name: $drug}) "
            "MERGE (v:Virus {name: $virus}) "
            "MERGE (p:Paper {title: $title}) "
            "MERGE (d)-[r:POTENTIAL_CANDIDATE]->(v) "
            "SET r.evidence = $evidence, r.confidence = 'High', r.last_updated = datetime() "
            "MERGE (d)-[:MENTIONED_IN]->(p) "
        )
        tx.run(query, drug=drug, virus=virus, title=title, evidence=evidence)

    def get_virus_graph(self, virus_name):
        """
        Retrieves the sub-graph for a specific virus to visualize in the frontend.
        Returns nodes and links formatted for react-force-graph.
        """
        if not self.driver:
            return {"nodes": [], "links": []}

        with self.driver.session() as session:
            return session.execute_read(self._fetch_graph, virus_name)

    @staticmethod
    def _fetch_graph(tx, virus_name):
        # Query to get Drug-Virus relationships and Papers
        query = (
            "MATCH (d:Drug)-[r1:POTENTIAL_CANDIDATE]->(v:Virus {name: $virus}) "
            "OPTIONAL MATCH (d)-[r2:MENTIONED_IN]->(p:Paper) "
            "RETURN d.name as drug, v.name as virus, r1.confidence as confidence, "
            "r1.evidence as evidence, collect(DISTINCT p.title) as papers"
        )
        result = tx.run(query, virus=virus_name)
        
        nodes_dict = {}
        links = []
        
        # Add the central virus node
        nodes_dict[virus_name] = {
            "id": virus_name,
            "label": virus_name,
            "group": "Virus"
        }
        
        for record in result:
            drug = record["drug"]
            papers = record["papers"]
            
            # Add drug node
            if drug not in nodes_dict:
                nodes_dict[drug] = {
                    "id": drug,
                    "label": drug,
                    "group": "Drug"
                }
            
            # Add Drug -> Virus relationship
            links.append({
                "source": drug,
                "target": virus_name,
                "label": "POTENTIAL_CANDIDATE",
                "type": "POTENTIAL_CANDIDATE"
            })
            
            # Add paper nodes and relationships
            for paper in papers:
                if paper and paper not in nodes_dict:
                    # Truncate long paper titles for display
                    short_title = paper[:50] + "..." if len(paper) > 50 else paper
                    nodes_dict[paper] = {
                        "id": paper,
                        "label": short_title,
                        "group": "Paper"
                    }
                    
                    # Add Drug -> Paper relationship
                    links.append({
                        "source": drug,
                        "target": paper,
                        "label": "MENTIONED_IN",
                        "type": "MENTIONED_IN"
                    })
        
        node_list = list(nodes_dict.values())
        
        return {"nodes": node_list, "links": links}
    
    def get_virus_data(self, virus_name):
        """
        Retrieves detailed drug-virus interaction data for the Data View.
        Returns a list of interactions with drug names, evidence, and confidence.
        """
        if not self.driver:
            return []
        
        with self.driver.session() as session:
            return session.execute_read(self._fetch_virus_data, virus_name)
    
    @staticmethod
    def _fetch_virus_data(tx, virus_name):
        query = (
            "MATCH (d:Drug)-[r:POTENTIAL_CANDIDATE]->(v:Virus {name: $virus}) "
            "OPTIONAL MATCH (d)-[:MENTIONED_IN]->(p:Paper) "
            "RETURN d.name as drug, r.evidence as evidence, r.confidence as confidence, "
            "collect(DISTINCT p.title) as papers"
        )
        result = tx.run(query, virus=virus_name)
        
        interactions = []
        for record in result:
            interactions.append({
                "drug": record["drug"],
                "evidence": record["evidence"],
                "confidence": record["confidence"] or "High",
                "papers": record["papers"]
            })
        
        return interactions