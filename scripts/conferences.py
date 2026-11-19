"""Rendu HTML des conférences de la page d'accueil, à partir de data/conferences.json.

Usage, après avoir modifié le fichier de données :
    python3 scripts/conferences.py

Les conférences datées sont rangées en « À venir » (de la plus proche à la plus lointaine) ou en
« Passées » (de la plus récente à la plus ancienne) selon la date du jour. Entre deux déploiements,
script.js déplace dans « Passées » une conférence dont la date vient de passer.
La traduction anglaise est portée par l'attribut data-en (voir i18n.js).
"""
import datetime
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "conferences.json"
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
    if "date" in item and not re.fullmatch(r"\d{4}(-\d{2}(-\d{2})?)?", str(item["date"])):
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


def replace_block(index_html, block):
    pattern = re.compile(re.escape(START_MARKER) + r".*?" + re.escape(END_MARKER), re.S)
    if not pattern.search(index_html):
        raise ValueError("Marqueurs des conférences introuvables dans index.html")
    return pattern.sub(lambda _: f"{START_MARKER}\n{block}{INDENT}{END_MARKER}", index_html, count=1)


if __name__ == "__main__":
    data = json.loads(DATA.read_text(encoding="utf-8"))
    today = datetime.date.today().isoformat()
    INDEX.write_text(replace_block(INDEX.read_text(encoding="utf-8"), render(data, today)), encoding="utf-8")
    n_up = sum(1 for i in data["conferences"] if len(i["date"]) == 10 and i["date"] >= today)
    print(f"index.html régénéré ({len(data['conferences'])} conférences dont {n_up} à venir, "
          f"{len(data.get('cours_recurrents', []))} cours récurrents)")
