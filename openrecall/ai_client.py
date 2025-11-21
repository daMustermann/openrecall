import os
import logging
import requests
from typing import List, Union
import numpy as np
from openai import OpenAI

from openrecall.config import get_config

logger = logging.getLogger(__name__)

class AIClient:
    def __init__(self):
        self.config = get_config()
        self.provider = self.config.get("ai_provider", "lm_studio")
        self.api_base = self.config.get("api_base", "http://localhost:1234/v1")
        self.api_key = self.config.get("api_key", "lm-studio")
        self.embedding_model = self.config.get("embedding_model", "text-embedding-nomic-embed-text-v1.5")
        self.chat_model = self.config.get("chat_model", "llama-3.2-3b-instruct")
        
        self.client = None
        if self.provider in ["lm_studio", "ollama", "openai"]:
            try:
                self.client = OpenAI(base_url=self.api_base, api_key=self.api_key)
                logger.info(f"Initialized OpenAI client for provider {self.provider} at {self.api_base}")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")

        # Fallback for embeddings if using local sentence-transformers (legacy/default fallback)
        self.local_embedder = None

    def get_embedding(self, text: str) -> np.ndarray:
        """Generates an embedding for the given text."""
        if not text or text.isspace():
            return np.zeros(384, dtype=np.float32) # Default dim, might need adjustment based on model

        if self.client:
            try:
                text = text.replace("\n", " ")
                response = self.client.embeddings.create(input=[text], model=self.embedding_model)
                embedding = response.data[0].embedding
                return np.array(embedding, dtype=np.float32)
            except Exception as e:
                logger.error(f"Error generating embedding with {self.provider}: {e}")
                # Fallback to local if configured or if remote fails? For now just return zeros or raise
                # In a robust system we might fallback, but let's stick to the configured provider.
                return np.zeros(384, dtype=np.float32) # Return zero vector on failure
        
        # Fallback/Legacy Local Logic (if we want to keep it as an option)
        # For now, if provider is 'local', we would use the old nlp.py logic here.
        # But user asked for LM Studio default.
        return np.zeros(384, dtype=np.float32)

    def generate_summary(self, text: str) -> str:
        """Generates a summary for the given text."""
        if not self.client:
            return "AI Client not initialized."

        # Truncate text to avoid context overflow (approx 2500 tokens)
        if len(text) > 10000:
            text = text[:10000] + "... (truncated)"

        try:
            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that summarizes text concisely."},
                    {"role": "user", "content": f"Summarize the following activity in 2-3 sentences:\n\n{text}"}
                ],
                temperature=0.7,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return "Failed to generate summary."

    def generate_title(self, text: str, event_type: str) -> str:
        """Generates a title for the event."""
        if not self.client:
            return f"{event_type.capitalize()} Session"

        # Truncate text to avoid context overflow
        if len(text) > 5000:
            text = text[:5000] + "... (truncated)"

        try:
            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant. Generate a short, descriptive title (max 5 words) for the user activity described."},
                    {"role": "user", "content": f"Activity type: {event_type}\nContext:\n{text}\n\nTitle:"}
                ],
                temperature=0.7,
            )
            return response.choices[0].message.content.strip().strip('"')
        except Exception as e:
            logger.error(f"Error generating title: {e}")
            return f"{event_type.capitalize()} Session"

# Global instance
ai_client = None

def get_ai_client():
    global ai_client
    if ai_client is None:
        ai_client = AIClient()
    return ai_client
