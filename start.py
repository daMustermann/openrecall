import os
import sys
import subprocess
import time
import webbrowser
import threading
import signal

def signal_handler(sig, frame):
    print("\nShutting down...")
    # The subprocesses should be killed by the cleanup in main
    sys.exit(0)

def main():
    print("Starting OpenRecall Unified Launch...")
    
    # 1. Start Backend
    print("Launching backend...")
    python_exe = sys.executable
    if os.path.exists(".venv/Scripts/python.exe"):
        python_exe = ".venv/Scripts/python.exe"
    elif os.path.exists(".venv/bin/python"):
        python_exe = ".venv/bin/python"
        
    backend_cmd = [python_exe, "-m", "openrecall.app"]
    backend_process = subprocess.Popen(backend_cmd)
    
    # 2. Start Frontend
    print("Launching frontend...")
    # Use shell=True for npm on Windows to find the executable
    frontend_cmd = ["npm", "run", "dev"]
    frontend_process = subprocess.Popen(frontend_cmd, shell=True)
    
    # 3. Open Browser
    def open_browser_delayed():
        time.sleep(5) # Wait for servers to start
        webbrowser.open("http://localhost:5173")
        
    threading.Thread(target=open_browser_delayed).start()
    
    print("OpenRecall is running. Press Ctrl+C to stop.")
    
    try:
        # Wait for processes
        while True:
            time.sleep(1)
            if backend_process.poll() is not None:
                print("Backend process ended unexpectedly.")
                break
            if frontend_process.poll() is not None:
                print("Frontend process ended unexpectedly.")
                break
    except KeyboardInterrupt:
        print("\nStopping...")
    finally:
        # Cleanup
        if backend_process.poll() is None:
            backend_process.terminate()
        if frontend_process.poll() is None:
            # On Windows, terminating the shell might not kill the child node process.
            # But for dev purposes, this is usually acceptable or requires taskkill.
            # Let's try simple terminate first.
            frontend_process.terminate()
            
        print("Goodbye!")

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    main()
