"""Rendu HTML des conférences de la page d'accueil.

Deux sources :
- data/conferences.json, écrit à la main (conférences anciennes, cours récurrents, traductions soignées) ;
- data/conferences-dashboard.json, recopié depuis MyDashboard : les présentations où « Afficher sur mon site »
  vaut Oui (titre, événement, lieu, date, et le titre anglais s'il est rempli ; jamais le contact).
Une conférence présente dans les deux (même date, même titre) est prise dans data/conferences.json.

Usage :
    python3 scripts/conferences.py              # régénère la page à partir des deux fichiers
    python3 scripts/conferences.py --dashboard  # recopie d'abord depuis MyDashboard (portfolioUP le fait)

Le dashboard est lu à l'adresse DASHBOARD_URL (par défaut http://127.0.0.1:3000). S'il ne répond pas,
la dernière copie est gardée et la page est régénérée quand même.

Les conférences datées sont rangées en « À venir » (de la plus proche à la plus lointaine) ou en
« Passées » (de la plus récente à la plus ancienne) selon la date du jour. Entre deux déploiements,
script.js déplace dans « Passées » une conférence dont la date vient de passer.
La traduction anglaise est portée par l'attribut data-en (voir i18n.js).
"""
import datetime
import html
import json
import os
import re
import sys
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "conferences.json"
DASHBOARD_COPY = ROOT / "data" / "conferences-dashboard.json"
DASHBOARD_URL = os.environ.get("DASHBOARD_URL", "http://127.0.0.1:3000").rstrip("/") + "/api/portfolio/talks"
DATE_RE = re.compile(r"\d{4}(-\d{2}(-\d{2})?)?")
INDEX = ROOT / "index.html"
START_MARKER = "<!-- CONFERENCES:START -->"
END_MARKER = "<!-- CONFERENCES:END -->"
MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
INDENT = " " * 28


def esc(text):
    """Texte d'un élément : seuls &, < et > sont échappés (les apostrophes restent lisibles dans la source)."""
    return html.escape(text, quote=False)


def attr(text):
    """Valeur d'attribut entre guillemets doubles."""
    return esc(text).replace('"', "&quot;")


def date_fr(iso):
    """« 2026-12-10 » → « 10 déc. 2026 », « 2026-09 » → « sept. 2026 », « 2026 » tel quel."""
    parts = iso.split("-")
    if len(parts) == 1:
        return parts[0]
    label = f"{MOIS[int(parts[1]) - 1]} {parts[0]}"
    return f"{int(parts[2])} {label}" if len(parts) == 3 else label


def check(item, where):
    if not item.get("titre"):
        sys.exit(f"Conférence sans titre dans {where} : {item}")
    if "date" in item and not DATE_RE.fullmatch(str(item["date"])):
        sys.exit(f"Date invalide (attendu AAAA-MM-JJ, AAAA-MM ou AAAA) : {item['date']!r} pour « {item['titre']} »")


def venue(item, en=False):
    """Ligne de détail : l'événement, puis le lieu, séparés par un point médian."""
    tr = item.get("en", {}) if en else {}
    parts = [tr.get("evenement", item.get("evenement")), tr.get("lieu", item.get("lieu"))]
    return " · ".join(p for p in parts if p)


def render_row(item, when_html, upcoming=False):
    tr = item.get("en", {})
    title_attrs = ' lang="en"' if item.get("lang") == "en" else ""
    if tr.get("titre"):
        title_attrs += f' data-en="{attr(tr["titre"])}"'
    meta_fr, meta_en = venue(item), venue(item, en=True)
    meta_attrs = f' data-en="{attr(meta_en)}"' if meta_en != meta_fr else ""
    meta = f'\n{INDENT}        <p class="row__meta"{meta_attrs}>{esc(meta_fr)}</p>' if meta_fr else ""
    row_attrs = f' class="row row--next" data-date="{item["date"]}"' if upcoming else ' class="row"'
    return (f'{INDENT}<article{row_attrs}>\n'
            f'{INDENT}    {when_html}\n'
            f'{INDENT}    <div class="row__body">\n'
            f'{INDENT}        <h4 class="row__title"{title_attrs}>{esc(item["titre"])}</h4>{meta}\n'
            f'{INDENT}    </div>\n'
            f'{INDENT}</article>\n')


def render(data, today):
    dated = data.get("conferences", [])
    recurring = data.get("cours_recurrents", [])
    for item in dated:
        check(item, "conferences")
        if "date" not in item:
            sys.exit(f"Conférence sans date : « {item['titre']} » (un cours sans date va dans cours_recurrents)")
    for item in recurring:
        check(item, "cours_recurrents")

    # Seule une date complète peut être « à venir » ; une date au mois ou à l'année est déjà passée
    def is_upcoming(item):
        return len(item["date"]) == 10 and item["date"] >= today

    upcoming = sorted((i for i in dated if is_upcoming(i)), key=lambda i: i["date"])
    # Tri des passées, de la plus récente à la plus ancienne : un mois ou une année seuls passent
    # après les dates précises de la même période (« 2026-09 » compte comme « 2026-09-00 »)
    past = sorted((i for i in dated if not is_upcoming(i)), key=lambda i: (i["date"] + "-00-00")[:10], reverse=True)

    when = lambda i: f'<time class="row__when" datetime="{i["date"]}">{date_fr(i["date"])}</time>'
    out = [f'{INDENT}<p class="rows__group rows__group--next" id="talksUpcomingLabel" data-i18n="t154"'
           f'{"" if upcoming else " hidden"}>À venir</p>\n']
    out += [render_row(i, when(i), upcoming=True) for i in upcoming]
    out.append(f'\n{INDENT}<p class="rows__group" id="talksPastLabel" data-i18n="t155">Passées</p>\n')
    out += [render_row(i, when(i)) for i in past]
    if recurring:
        out.append(f'\n{INDENT}<p class="rows__group" data-i18n="t156">Cours récurrents</p>\n')
        for item in recurring:
            since = item.get("depuis")
            label = f'<span class="row__when" data-en="since {since}">depuis {since}</span>' if since else '<span class="row__when"></span>'
            out.append(render_row(item, label))
    return "".join(out)


def same_talk_key(item):
    """Clé de doublon : la date et le titre, sans casse, accents, apostrophes typographiques ni point final."""
    title = re.sub("[\u2018\u2019\u02bc`]", "'", item.get("titre", ""))  # avant de retirer les accents
    title = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode()
    title = re.sub(r"\s+", " ", title.lower()).strip().rstrip(".")
    return (str(item.get("date", "")), title)


def merge_dashboard(data, copy):
    """Ajoute les conférences du dashboard absentes de data/conferences.json."""
    manual = {same_talk_key(i) for i in data.get("conferences", [])}
    added = []
    for item in copy.get("conferences", []):
        if not item.get("titre") or not DATE_RE.fullmatch(str(item.get("date", ""))):
            print(f"⚠️  Ignorée (titre ou date manquant) : {item}")
            continue
        if same_talk_key(item) not in manual:
            added.append(item)
    return {**data, "conferences": data.get("conferences", []) + added}, len(added)


def fetch_dashboard():
    """Recopie les présentations « Afficher sur mon site » depuis MyDashboard. Renvoie False s'il ne répond pas."""
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # adresse locale : pas de proxy
    try:
        with opener.open(DASHBOARD_URL, timeout=5) as response:
            talks = json.load(response)["conferences"]
    except Exception as error:  # dashboard arrêté, ou version sans la case « Afficher sur mon site »
        print(f"⚠️  MyDashboard ne répond pas ({DASHBOARD_URL} : {error}) : dernière copie conservée")
        return False
    copy = {
        "_aide": "Copie automatique depuis MyDashboard (portfolioUP) : ne pas modifier, corriger dans le dashboard.",
        "conferences": sorted(talks, key=lambda t: (str(t.get("date", "")), t.get("titre", "")), reverse=True),
    }
    DASHBOARD_COPY.write_text(json.dumps(copy, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"MyDashboard : {len(talks)} présentation(s) à afficher sur le site")
    return True


def replace_block(index_html, block):
    pattern = re.compile(re.escape(START_MARKER) + r".*?" + re.escape(END_MARKER), re.S)
    if not pattern.search(index_html):
        raise ValueError("Marqueurs des conférences introuvables dans index.html")
    return pattern.sub(lambda _: f"{START_MARKER}\n{block}{INDENT}{END_MARKER}", index_html, count=1)


if __name__ == "__main__":
    if "--dashboard" in sys.argv[1:]:
        fetch_dashboard()
    data = json.loads(DATA.read_text(encoding="utf-8"))
    added = 0
    if DASHBOARD_COPY.exists():
        data, added = merge_dashboard(data, json.loads(DASHBOARD_COPY.read_text(encoding="utf-8")))
    today = datetime.date.today().isoformat()
    INDEX.write_text(replace_block(INDEX.read_text(encoding="utf-8"), render(data, today)), encoding="utf-8")
    n_up = sum(1 for i in data["conferences"] if len(i["date"]) == 10 and i["date"] >= today)
    print(f"index.html régénéré ({len(data['conferences'])} conférences dont {n_up} à venir, "
          f"{added} venue(s) du dashboard, {len(data.get('cours_recurrents', []))} cours récurrents)")
