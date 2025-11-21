import numpy as np
import logging
from openrecall.ai_client import get_ai_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
EMBEDDING_DIM: int = 384  # Dimension for all-MiniLM-L6-v2 (default)

def get_embedding(text: str) -> np.ndarray:
    """
    Generates a sentence embedding for the given text using the configured AI client.
    """
    client = get_ai_client()
    return client.get_embedding(text)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Calculates the cosine similarity between two numpy vectors.

    Args:
        a: The first numpy array.
        b: The second numpy array.

    Returns:
        The cosine similarity score (float between -1 and 1),
        or 0.0 if either vector has zero magnitude.
    """
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        logger.warning(
            "One or both vectors have zero magnitude. Returning 0 similarity."
        )
        return 0.0

    similarity = np.dot(a, b) / (norm_a * norm_b)
    # Clip values to handle potential floating-point inaccuracies slightly outside [-1, 1]
    return float(np.clip(similarity, -1.0, 1.0))
