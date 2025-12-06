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

    def add_interaction(self, drug, virus, paper_title, evidence, pmid=None):
        """
        Creates the following graph structure:
        (Drug)-[:POTENTIAL_CANDIDATE]->(Virus)
        (Drug)-[:MENTIONED_IN]->(Paper)
        """
        if not self.driver:
            return

        with self.driver.session() as session:
            try:
                session.execute_write(self._create_nodes, drug, virus, paper_title, evidence, pmid)
            except Exception as e:
                logger.error(f"❌ Graph Write Error: {e}")

    @staticmethod
    def _create_nodes(tx, drug, virus, title, evidence, pmid):
        # Cypher Query: Merge ensures we don't create duplicates
        # Use PMID as primary key if available, otherwise fallback to title
        query = (
            "MERGE (d:Drug {name: $drug}) "
            "MERGE (v:Virus {name: $virus}) "
            "MERGE (p:Paper {id: COALESCE($pmid, $title)}) "
            "SET p.title = $title "
            "MERGE (d)-[r:POTENTIAL_CANDIDATE]->(v) "
            "SET r.evidence = $evidence, r.confidence = 'High', r.last_updated = datetime() "
            "MERGE (d)-[:MENTIONED_IN]->(p) "
        )
        tx.run(query, drug=drug, virus=virus, title=title, evidence=evidence, pmid=pmid)

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
        """
        Fetches the knowledge graph around the target virus.
        Uses a generic 2-hop traversal to find connected Nodes (Drug, Paper, etc.)
        and Relationships (POTENTIAL_CANDIDATE, MENTIONED_IN, etc.).
        """
        # Generic query to fetch Virus and its 2-hop neighborhood.
        # This allows the frontend to be flexible with node types.
        # Limit paths to avoid overwhelming the visualization.
        query = (
            "MATCH (v:Virus) WHERE toLower(v.name) CONTAINS toLower($virus) "
            "OPTIONAL MATCH path = (v)-[*1..2]-(n) "
            "WHERE NOT (n:Virus AND n <> v) "
            "RETURN path LIMIT 200"
        )
        
        result = tx.run(query, virus=virus_name)
        
        nodes_dict = {}
        links_dict = {} # Use dict to avoid duplicate links key
        
        for record in result:
            path = record["path"]
            if not path:
                continue
                
            # Iterate through all nodes in the path
            for node in path.nodes:
                node_id = None
                node_type = "Unknown"
                
                # Determine ID and Type based on labels
                labels = list(node.labels)
                if "Virus" in labels:
                    node_type = "Virus"
                    # Canonicalize Virus ID to the search term (Title Case) to merge duplicates
                    # e.g., "dengue", "Dengue Virus" -> "Dengue"
                    node_id = virus_name.title()
                elif "Drug" in labels:
                    node_id = node.get("name")
                    node_type = "Drug"
                elif "Paper" in labels:
                    node_id = node.get("title") or node.get("id")
                    node_type = "Paper"
                else:
                    # Fallback for other nodes
                    node_id = node.get("name") or node.get("id") or str(node.id)
                    node_type = labels[0] if labels else "Unknown"

                # Truncate long IDs for display label
                label = node_id
                if node_type == "Paper" and label and len(label) > 30:
                    label = label[:30] + "..."
                
                # For non-virus nodes, we use the original logic
                # For Virus nodes, we've already normalized node_id
                
                if node_id and node_id not in nodes_dict:
                    nodes_dict[node_id] = {
                        "id": node_id,
                        "label": label,
                        "type": node_type
                    }
            
            # Iterate through all relationships in the path
            for rel in path.relationships:
                start_node = rel.start_node
                end_node = rel.end_node
                
                # Resolve IDs for start/end with same normalization logic
                def resolve_id(n):
                    lbls = list(n.labels)
                    if "Virus" in lbls:
                        return virus_name.title()
                    elif "Drug" in lbls:
                        return n.get("name")
                    elif "Paper" in lbls:
                        return n.get("title") or n.get("id")
                    return n.get("name") or n.get("id") or str(n.id)

                start_id = resolve_id(start_node)
                end_id = resolve_id(end_node)
                
                # Create unique link key
                link_key = f"{start_id}-{rel.type}-{end_id}"
                
                if link_key not in links_dict:
                    links_dict[link_key] = {
                        "source": start_id,
                        "target": end_id,
                        "label": rel.type,
                        "type": rel.type
                    }

        return {"nodes": list(nodes_dict.values()), "links": list(links_dict.values())}
    
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
            "MATCH (d:Drug)-[r:POTENTIAL_CANDIDATE]->(v:Virus) "
            "WHERE toLower(v.name) CONTAINS toLower($virus) "
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