import time
import threading
import ctypes
import json
import logging
from typing import Optional

from openrecall.database import get_pending_jobs, update_job_status, insert_event, get_event_by_id, update_entry_embedding
from openrecall.clustering import run_clustering
from openrecall.ai_client import get_ai_client

logger = logging.getLogger(__name__)

class Scheduler:
    def __init__(self):
        self.running = False
        self.thread = None
        self.idle_threshold = 60 # Seconds of inactivity to consider idle
        self.check_interval = 5 # Seconds between checks

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()
        logger.info("Scheduler started.")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()
        logger.info("Scheduler stopped.")

    def _loop(self):
        while self.running:
            try:
                # Check for manual trigger or idle
                # For now, we just check pending jobs.
                # In a real implementation, we might want to wait for idle for heavy tasks.
                # But "clustering" should happen relatively fast.
                # "AI Summary" is heavy.
                
                jobs = get_pending_jobs()
                if jobs:
                    for job in jobs:
                        if not self.running:
                            break
                            
                        # Check idle for heavy jobs
                        if job.type in ["generate_summary", "generate_title", "generate_embedding"]:
                            if not self.is_idle():
                                # Skip heavy jobs if not idle
                                # But if the user clicked "Process Now", we should ignore idle check.
                                # We can add a "force" flag in payload.
                                if not job.payload.get("force", False):
                                    continue
                        
                        self.process_job(job)
                else:
                    # If no jobs, maybe run clustering if enough new entries?
                    # For now, let's assume clustering is triggered by screenshot loop or a job.
                    pass
                    
                time.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Scheduler loop error: {e}")
                time.sleep(self.check_interval)

    def process_job(self, job):
        logger.info(f"Processing job {job.id}: {job.type}")
        update_job_status(job.id, "processing")
        
        try:
            if job.type == "cluster":
                # Run clustering
                # TODO: Implement incremental clustering in clustering.py
                # For now, just run the function (it's a placeholder in previous step)
                # We need to actually implement the logic to update DB.
                # Let's assume run_clustering() does the work.
                pass 
                
            elif job.type == "generate_summary":
                event_id = job.payload.get("event_id")
                text = job.payload.get("text")
                if event_id and text:
                    client = get_ai_client()
                    summary = client.generate_summary(text)
                    
                    # Update event in DB
                    # We need a function to update event fields.
                    # For now, let's use raw SQL or add a helper in database.py
                    # HACK: Re-insert event with updated description
                    event = get_event_by_id(event_id)
                    if event:
                        # Convert namedtuple to dict
                        event_dict = event._asdict()
                        event_dict["description"] = summary
                        insert_event(event_dict)
                        
            elif job.type == "generate_title":
                event_id = job.payload.get("event_id")
                text = job.payload.get("text")
                event_type = job.payload.get("event_type", "activity")
                if event_id and text:
                    client = get_ai_client()
                    title = client.generate_title(text, event_type)
                    
                    event = get_event_by_id(event_id)
                    if event:
                        event_dict = event._asdict()
                        event_dict["title"] = title
                        insert_event(event_dict)

            update_job_status(job.id, "completed")
            logger.info(f"Job {job.id} completed.")
            
        except Exception as e:
            logger.error(f"Job {job.id} failed: {e}")
            update_job_status(job.id, "failed")

    def is_idle(self) -> bool:
        """Check if the user is idle."""
        try:
            class LASTINPUTINFO(ctypes.Structure):
                _fields_ = [
                    ("cbSize", ctypes.c_uint),
                    ("dwTime", ctypes.c_uint),
                ]
                
            lii = LASTINPUTINFO()
            lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
            if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii)):
                millis = ctypes.windll.kernel32.GetTickCount() - lii.dwTime
                return millis / 1000.0 > self.idle_threshold
        except Exception:
            return False
        return False

# Global instance
scheduler = Scheduler()
