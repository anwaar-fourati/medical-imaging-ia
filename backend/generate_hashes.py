"""
generate_hashes.py — Génère les hash bcrypt pour les comptes de démo
Exécutez : python generate_hashes.py
Puis copiez les hash dans database.py > SEED_SQL
"""
import bcrypt

passwords = {
    'dr.martin': 'radio2024',
    'dr.ahmed':  'radio2024',
}

for username, password in passwords.items():
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()
    print(f"{username}: {hashed}")