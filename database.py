
import sqlite3

def get_connection():
    return sqlite3.connect("CompteSurMoi.db")

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS utilisateurs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            pseudo TEXT NOT NULL, 
            id_groupe INTEGER NOT NULL, 
            FOREIGN KEY(id_groupe) REFERENCES groupes(id)
        );
        
        CREATE TABLE IF NOT EXISTS groupes (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            nom TEXT NOT NULL
        );
                   
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            nom TEXT NOT NULL, 
            montant REAL NOT NULL, 
            id_payeur INTEGER NOT NULL, 
            id_groupe INTEGER NOT NULL, 
            FOREIGN KEY(id_payeur) REFERENCES utilisateurs(id), 
            FOREIGN KEY(id_groupe) REFERENCES groupes(id)
        );
                   
        CREATE TABLE IF NOT EXISTS repartitions (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            id_transaction INTEGER NOT NULL, 
            id_utilisateur INTEGER NOT NULL, 
            montant REAL NOT NULL, 
            FOREIGN KEY(id_transaction) REFERENCES transactions(id), 
            FOREIGN KEY(id_utilisateur) REFERENCES utilisateurs(id), 
            UNIQUE(id_transaction, id_utilisateur)
        );
    """)
    conn.commit()
    conn.close()


def creer_groupe(nom):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO groupes (nom) VALUES (?)", (nom,))
    conn.commit()
    id = cursor.lastrowid
    conn.close()
    return id


def creer_utilisateur(pseudo, id_groupe):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO utilisateurs (pseudo, id_groupe) VALUES (?, ?)", (pseudo, id_groupe))
    conn.commit()
    id = cursor.lastrowid
    conn.close()
    return id


def ajouter_transaction(nom, montant, id_payeur, id_groupe, participants):
    # participants = {1: 12.50, 2: 12.50, 3: 25.00}
    # clé = id_utilisateur, valeur = montant dû par cet utilisateur
    try : 
        if round(sum(participants.values()), 2) != round(montant, 2):
            raise ValueError("...")
        
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO transactions (nom, montant, id_payeur, id_groupe) VALUES (?, ?, ?, ?)", (nom, montant, id_payeur, id_groupe))
        id = cursor.lastrowid
        
        for cle, val in participants.items():
            cursor.execute("INSERT INTO repartitions (id_transaction, id_utilisateur, montant) VALUES (?, ?, ?)", (id, cle, val))

        conn.commit()
        conn.close()
        return id
    except ValueError :
        print("La somme des montants de tous les participants doit être égale au montant total")


def recup_id_utilisateurs_groupe(id_groupe):
    #retourne la liste des id des utilisateurs faisant parti d'un groupe
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM utilisateurs WHERE id_groupe =?", (id_groupe,))
    rows = cursor.fetchall()
    id = []
    for i in range(len(rows)):
        id.append(rows[i][0])
    conn.close()
    return id

def recup_pseudo_utilisateurs_groupe(id_groupe):
    #retourne la liste des id des utilisateurs faisant parti d'un groupe
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM utilisateurs WHERE id_groupe =?", (id_groupe,))
    rows = cursor.fetchall()
    pseudo = []
    for i in range(len(rows)):
        pseudo.append(rows[i][1])
    conn.close()
    return pseudo


def sum_montant_payeur(id_utilisateur):
    #retourne la somme de tout ce qu'a payé un utilisateur, s'il n'a jamais payé, retourne 0
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT SUM(montant) FROM transactions WHERE id_payeur = ?", (id_utilisateur,))
    result = cursor.fetchone()[0]
    conn.close()
    return result if result is not None else 0.0


def sum_montant_utilisateur(id_utilisateur):
    #retourne la somme de tout ce qu'a "consommé" (sans forcément payer) un utilisateur
    s = 0
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM repartitions WHERE id_utilisateur =?", (id_utilisateur,))
    rows = cursor.fetchall()
    for i in range(len(rows)):
        s += rows[i][3]
    conn.close()
    return s


def calculer_soldes(id_groupe):
    #calcul le solde de tous les utilisateurs d'un groupe
    id_utilisateurs = recup_id_utilisateurs_groupe(id_groupe)
    pseudo_utilisateurs = recup_pseudo_utilisateurs_groupe(id_groupe)
    D = {}
    for i in range(len(id_utilisateurs)):
        D[id_utilisateurs[i]]={'pseudo':pseudo_utilisateurs[i], 'solde':sum_montant_payeur(id_utilisateurs[i])-sum_montant_utilisateur(id_utilisateurs[i])}
    return D


def calculer_remboursements(id_groupe):
    soldes = calculer_soldes(id_groupe)
    soldes_liste = [[k, v["pseudo"], v["solde"]] for k, v in soldes.items()]
    remboursements = []

    while any(abs(s[2]) > 0.01 for s in soldes_liste):
        # Trier à chaque tour
        debiteurs = sorted([s for s in soldes_liste if s[2] < -0.01], key=lambda x: x[2])
        crediteurs = sorted([s for s in soldes_liste if s[2] > 0.01], key=lambda x: x[2], reverse=True)

        # Plus gros débiteur et plus gros créditeur
        debiteur = debiteurs[0]
        crediteur = crediteurs[0]

        # Montant du virement
        montant = min(abs(debiteur[2]), crediteur[2])

        # Enregistrer le remboursement
        remboursements.append({
            "de": debiteur[1],
            "à": crediteur[1],
            "montant": round(montant, 2)
        })

        # Mettre à jour les soldes dans soldes_liste
        for s in soldes_liste:
            if s[0] == debiteur[0]:
                s[2] += montant  # débiteur se rapproche de 0
            if s[0] == crediteur[0]:
                s[2] -= montant  # créditeur se rapproche de 0

    return remboursements

print(calculer_remboursements(1))