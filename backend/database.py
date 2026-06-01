"""
database.py — Connexion PostgreSQL + initialisation du schéma RadioScan AI
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

# ─── Configuration ────────────────────────────────────────────────────────────
DATABASE_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://radioscan:radioscan2024@localhost:5432/radioscan_db'
)

# ─── Connexion ────────────────────────────────────────────────────────────────
def get_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

# ─── Initialisation du schéma ─────────────────────────────────────────────────
SCHEMA_SQL = """
-- Table des radiologues (authentification)
CREATE TABLE IF NOT EXISTS radiologues (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(80)  UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,   -- bcrypt hash
    name        VARCHAR(150) NOT NULL,
    role        VARCHAR(100) NOT NULL DEFAULT 'Radiologue',
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Table des patients
CREATE TABLE IF NOT EXISTS patients (
    id              SERIAL PRIMARY KEY,
    nom             VARCHAR(100) NOT NULL,
    prenom          VARCHAR(100) NOT NULL,
    cin             VARCHAR(20)  UNIQUE NOT NULL,
    date_naissance  DATE,
    sexe            VARCHAR(20),
    telephone       VARCHAR(30),
    medecin         VARCHAR(150),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Table des analyses
CREATE TABLE IF NOT EXISTS analyses (
    id              SERIAL PRIMARY KEY,
    patient_id      INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    radiologue_id   INTEGER REFERENCES radiologues(id),
    prediction      VARCHAR(50)  NOT NULL,
    label           VARCHAR(100) NOT NULL,
    confidence      FLOAT        NOT NULL,
    all_probabilities JSONB,
    color           VARCHAR(20),
    gradcam_base64  TEXT,
    image_base64    TEXT,
    comment         TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_analyses_patient  ON analyses(patient_id);
CREATE INDEX IF NOT EXISTS idx_analyses_radiologue ON analyses(radiologue_id);
CREATE INDEX IF NOT EXISTS idx_patients_cin      ON patients(cin);
"""

SEED_SQL = """
INSERT INTO radiologues (username, password, name, role) VALUES
  ('dr.martin', '$2b$12$/VQmYjBosalmGaeYkGTNPuQk7mFMEl82pQkGQxS0fWdxw73WLR0BG', 'Dr. Sophie Martin', 'Radiologue Senior'),
  ('dr.ahmed',  '$2b$12$qNhddkEvtGLq9mmWSgLHiu9SuBXxuJ.MkcTzxFaHguptXfvufmT3u', 'Dr. Karim Ahmed',   'Radiologue')
ON CONFLICT (username) DO NOTHING;
"""
# Note : hash correspond à 'radio2024' — régénérez en production avec bcrypt.hashpw()

def init_db():
    """Crée les tables et insère les données de démo si vides."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(SCHEMA_SQL)
            cur.execute(SEED_SQL)
    print("✅ Base de données initialisée")

if __name__ == '__main__':
    init_db()
    