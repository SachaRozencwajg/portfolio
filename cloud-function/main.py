import functions_framework
import requests
import json
import os
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from github import Github
from datetime import datetime

from publications_html import format_authors, replace_block

# Configuration
PUBMED_AUTHOR = "Rozencwajg+S"
GITHUB_REPO = "SachaRozencwajg/portfolio"
PUBLICATIONS_FILE = ".agent/publications.json"
INDEX_FILE = "index.html"

# Email Configuration
EMAIL_SENDER = os.environ.get("EMAIL_SENDER")
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD")
EMAIL_RECEIVER = "sacha.rozencwajg@gmail.com"

# PubMed E-utilities API
ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
ESUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"


def get_pubmed_count():
    """Récupère le nombre actuel de publications sur PubMed."""
    params = {
        "db": "pubmed",
        "term": PUBMED_AUTHOR,
        "retmode": "json"
    }
    response = requests.get(ESEARCH_URL, params=params)
    data = response.json()
    return int(data["esearchresult"]["count"])


def get_new_publications(known_pmids):
    """Récupère les nouvelles publications non connues."""
    # Recherche des IDs de publications
    params = {
        "db": "pubmed",
        "term": PUBMED_AUTHOR,
        "retmode": "json",
        "retmax": 100,
        "sort": "date"
    }
    response = requests.get(ESEARCH_URL, params=params)
    data = response.json()
    all_pmids = data["esearchresult"]["idlist"]
    
    # Filtrer les nouveaux
    new_pmids = [pmid for pmid in all_pmids if pmid not in known_pmids]
    
    if not new_pmids:
        return []
    
    # Récupérer les détails des nouvelles publications
    summary_params = {
        "db": "pubmed",
        "id": ",".join(new_pmids),
        "retmode": "json"
    }
    summary_response = requests.get(ESUMMARY_URL, params=summary_params)
    summary_data = summary_response.json()
    
    new_publications = []
    for pmid in new_pmids:
        if pmid in summary_data.get("result", {}):
            pub = summary_data["result"][pmid]
            
            # Extraire les auteurs
            authors = pub.get("authors", [])
            author_names = [a.get("name", "") for a in authors]
            
            # Trouver la position de Rozencwajg
            position = "middle"
            for i, name in enumerate(author_names):
                if "Rozencwajg" in name:
                    if i == 0:
                        position = "1st"
                    elif i == len(author_names) - 1:
                        position = "last"
                    else:
                        position = str(i + 1)
                    break
            
            # Formater les auteurs pour l'affichage (vraie position de Rozencwajg S)
            authors_display = format_authors(author_names)
            
            # Extraire l'année
            pubdate = pub.get("pubdate", "")
            year_match = re.search(r"(\d{4})", pubdate)
            year = int(year_match.group(1)) if year_match else datetime.now().year
            
            new_publications.append({
                "pmid": pmid,
                "year": year,
                "title": pub.get("title", ""),
                "authors": authors_display,
                "author_position": position,
                "journal": pub.get("fulljournalname", pub.get("source", "")),
                "doi": next((id_obj.get("value", "") for id_obj in pub.get("articleids", []) if id_obj.get("idtype") == "doi"), "")
            })
    
    return new_publications


def update_github_files(g, new_publications, current_data, current_html):
    """Met à jour les fichiers sur GitHub."""
    repo = g.get_repo(GITHUB_REPO)
    
    # 1. Mettre à jour publications.json
    for pub in new_publications:
        current_data["publications"].insert(0, pub)
    current_data["total_count"] = len(current_data["publications"])
    current_data["last_checked"] = datetime.now().strftime("%Y-%m-%d")
    
    new_json = json.dumps(current_data, indent=4, ensure_ascii=False)
    
    # 2. Régénérer toute la liste dans index.html (triée par année, sans doublon masqué)
    updated_html = replace_block(current_html, current_data["publications"])

    # Commit les changements
    commit_message = f"🔄 Auto-update: {len(new_publications)} nouvelle(s) publication(s) ajoutée(s)"
    
    # Récupérer les fichiers actuels pour avoir leur SHA
    json_file = repo.get_contents(PUBLICATIONS_FILE)
    html_file = repo.get_contents(INDEX_FILE)
    
    # Mettre à jour publications.json
    repo.update_file(
        PUBLICATIONS_FILE,
        commit_message,
        new_json,
        json_file.sha
    )
    
    # Mettre à jour index.html
    repo.update_file(
        INDEX_FILE,
        commit_message,
        updated_html,
        html_file.sha
    )
    
    return True


def send_email(subject, body):
    """Envoie un email via Gmail SMTP."""
    if not EMAIL_SENDER or not EMAIL_PASSWORD:
        print("⚠️ Email configuration missing. Skipping email.")
        return False
        
    msg = MIMEMultipart()
    msg['From'] = EMAIL_SENDER
    msg['To'] = EMAIL_RECEIVER
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))
    
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.send_message(msg)
        print("✅ Email sent successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False


@functions_framework.http
def check_publications(request):
    """Cloud Function principale - déclenchée par Cloud Scheduler."""
    
    # Récupérer le token GitHub depuis Secret Manager
    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        return {"error": "GitHub token not configured"}, 500
    
    try:
        g = Github(github_token)
        repo = g.get_repo(GITHUB_REPO)
        
        # Récupérer le fichier publications.json actuel
        publications_content = repo.get_contents(PUBLICATIONS_FILE)
        current_data = json.loads(publications_content.decoded_content.decode())
        
        # Comparer les PMID (et non les compteurs, qui divergent à cause des doublons
        # masqués et des articles absents de la recherche auteur)
        known_pmids = [pub["pmid"] for pub in current_data.get("publications", [])]
        new_publications = get_new_publications(known_pmids)

        if not new_publications:
            pubmed_count = get_pubmed_count()
            message = "Aucune nouvelle publication détectée."
            send_email(
                subject="PubMed Agent: Rien à signaler",
                body=f"<h3>Bonjour Sacha,</h3><p>{message}</p><p>Total PubMed: {pubmed_count}</p><p>Vérification du {datetime.now().strftime('%d/%m/%Y')}.</p>"
            )
            return {
                "status": "no_update",
                "message": f"{message} PubMed: {pubmed_count}, Stocké: {len(known_pmids)}",
                "checked_at": datetime.now().isoformat()
            }

        # Récupérer index.html pour mise à jour
        html_content = repo.get_contents(INDEX_FILE)
        current_html = html_content.decoded_content.decode()
        
        # Mettre à jour GitHub
        update_github_files(g, new_publications, current_data, current_html)
        
        # Envoyer l'email de succès
        email_body = f"<h3>Bonjour Sacha,</h3><p>🚀 {len(new_publications)} nouvelle(s) publication(s) trouvée(s) et ajoutée(s) au site !</p><ul>"
        for pub in new_publications:
            email_body += f"<li><strong>{pub['title']}</strong> ({pub['year']}) <br><em>{pub['journal']}</em></li>"
        email_body += "</ul><p>Le déploiement automatique du site va démarrer.</p>"
        
        send_email(
            subject=f"PubMed Agent: 🚀 {len(new_publications)} Nouveautés !",
            body=email_body
        )
        
        return {
            "status": "updated",
            "message": f"{len(new_publications)} nouvelle(s) publication(s) ajoutée(s)",
            "new_publications": [pub["title"] for pub in new_publications],
            "checked_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        error_msg = str(e)
        send_email(
            subject="PubMed Agent: ⚠️ Erreur",
            body=f"<h3>Bonjour Sacha,</h3><p>Une erreur est survenue lors de la vérification :</p><pre>{error_msg}</pre>"
        )
        return {"error": error_msg}, 500
