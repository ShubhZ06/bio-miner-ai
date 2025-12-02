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