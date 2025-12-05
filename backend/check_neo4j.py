import socket
import sys

def check_port(host, port):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        s.connect((host, port))
        s.close()
        return True
    except Exception:
        return False

if __name__ == "__main__":
    host = "localhost"
    port = 7687
    if check_port(host, port):
        print(f"✅ Port {port} is OPEN. Neo4j seems to be running.")
        sys.exit(0)
    else:
        print(f"❌ Port {port} is CLOSED. Neo4j is NOT running or not accessible.")
        sys.exit(1)
