"""
Zero-shot sector classification using sentence embeddings.

Rather than requiring a labeled training dataset (which a hackathon prototype
will not have), each sector is represented by a short natural-language
description. The incoming problem text is embedded and compared against every
sector description using cosine similarity; the best match is returned along
with the similarity score as the confidence.
"""

from sentence_transformers import SentenceTransformer, util

SECTOR_DESCRIPTIONS = {
    "Agriculture": "Farming, crops, livestock, irrigation, agricultural productivity and rural farm livelihoods",
    "Education": "Schools, students, teachers, learning outcomes, literacy, access to quality education",
    "Healthcare": "Hospitals, medical care, disease, public health, patient access, medicine and treatment",
    "Transportation": "Roads, traffic, public transit, vehicles, commuting, transport infrastructure",
    "Environment": "Pollution, climate change, deforestation, biodiversity, ecological degradation",
    "Water": "Drinking water access, water scarcity, sanitation, water quality, irrigation supply",
    "Energy": "Electricity access, power outages, renewable energy, fuel, energy infrastructure",
    "Waste Management": "Garbage collection, recycling, landfill, solid waste disposal, sanitation waste",
    "Public Safety": "Crime, policing, disaster response, road safety, emergency services",
    "Employment": "Jobs, unemployment, livelihoods, income, labor market, workforce skills",
    "Infrastructure": "Roads, bridges, buildings, construction, public facilities, urban infrastructure",
    "Rural Development": "Village development, rural livelihoods, remote area access to services",
    "Accessibility": "Disability access, inclusive design, mobility for elderly or disabled individuals",
    "Women and Child Welfare": "Women's safety, child welfare, maternal health, gender equality, child education",
    "Other": "General societal issue that does not clearly belong to a specific listed sector",
}

_model = None
_sector_embeddings = None
_sectors = list(SECTOR_DESCRIPTIONS.keys())


def _get_model():
    global _model, _sector_embeddings
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        descriptions = list(SECTOR_DESCRIPTIONS.values())
        _sector_embeddings = _model.encode(descriptions, convert_to_tensor=True)
    return _model


def classify_sector(text: str, low_confidence_threshold: float = 0.35):
    """Returns (sector, subsector, confidence)."""
    model = _get_model()
    text_embedding = model.encode(text, convert_to_tensor=True)

    scores = util.cos_sim(text_embedding, _sector_embeddings)[0]
    best_idx = int(scores.argmax())
    confidence = float(scores[best_idx])

    sector = _sectors[best_idx]
    if confidence < low_confidence_threshold:
        sector = "Other"

    return sector, None, round(confidence, 4)
