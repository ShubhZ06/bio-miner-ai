---
description: How to run the Bio-Miner AI Project
---

# Bio-Miner AI: Startup Guide

The project is configured to run all components (Frontend + Backend + Database Connection) with a single command.

## Quick Start
1. Double-click the `run.bat` file in the project folder.
   OR
2. Open a terminal in `c:\bio\bio-miner-ai` and run:
   ```powershell
   npm start
   ```

## What Happens
When you run this command:
1. **Frontend**: Starts the React application on `http://localhost:3000`.
2. **Backend**: Starts the FastAPI server on `http://localhost:8000`.
3. **Database**: The backend automatically connects to your cloud **Neo4j Aura** instance.

> [!NOTE]
> You do NOT need to run a local Neo4j database manually. The application connects to the cloud automatically.
