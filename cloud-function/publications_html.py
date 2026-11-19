"""Rendu HTML de la liste des publications (partagé par la Cloud Function et le rendu local).

Usage local, pour régénérer index.html à partir de .agent/publications.json :
    python3 cloud-function/publications_html.py
"""
import html
import json
import re
from pathlib import Path

AUTHOR_NAME = "Rozencwajg S"
START_MARKER = "<!-- PUBLICATIONS:START -->"
END_MARKER = "<!-- PUBLICATIONS:END -->"


def format_authors(names):
    """Formate la liste d'auteurs en conservant la vraie position de Rozencwajg S.

    - 4 auteurs ou moins : tous affichés ;
    - Rozencwajg dans les 3 premiers : 3 premiers + « et al. » ;
    - sinon : 2 premiers, « … », Rozencwajg S, puis « et al. » s'il n'est pas dernier auteur.
    """
    names = [n for n in names if n]
    if len(names) <= 4:
        return ", ".join(names)
    idx = next((i for i, n in enumerate(names) if n.startswith("Rozencwajg")), None)
    if idx is None or idx < 3:
        return ", ".join(names[:3]) + ", et al."
    shown = names[:2] + ["…", names[idx]]
    suffix = "" if idx == len(names) - 1 else ", et al."
    return ", ".join(shown) + suffix


def sort_publications(publications):
    """Tri antéchronologique (année, puis PMID comme proxy de la date d'indexation)."""
    return sorted(
        publications,
        key=lambda p: (int(p.get("year") or 0), int(p.get("pmid") or 0)),
        reverse=True,
    )


# Mots qui restent en minuscules dans un nom de revue, sauf en tête
SMALL_WORDS = {"and", "of", "in", "the", "for", "on", "to", "a", "an"}
# Graphies que la règle générale ne retrouve pas
JOURNAL_NAMES = {"plos one": "PLOS ONE"}


def tidy_journal(name):
    """Nom de revue homogène d'une ligne à l'autre.

    PubMed renvoie tantôt « Scientific reports », tantôt « Scientific Reports », avec parfois le
    lieu d'édition (« Critical care (London, England) ») ou un sous-titre après deux-points.
    """
    name = re.sub(r"\s*:\s.*$", "", name or "")
    name = re.sub(r"\s*\([^)]*\)", "", name)
    name = name.replace(",", "").strip().rstrip(".")
    if name.lower() in JOURNAL_NAMES:
        return JOURNAL_NAMES[name.lower()]
    words = []
    for i, word in enumerate(name.split()):
        low = word.lower()
        if i and low in SMALL_WORDS:
            words.append(low)
        elif len(word) > 1 and word.isupper():
            words.append(word)  # sigle
        else:
            words.append(low[:1].upper() + low[1:])
    return " ".join(words)


def render_card(pub):
    """Une ligne de la liste : année, titre (lien PubMed), puis auteurs, revue et DOI."""
    authors = html.escape(pub["authors"]).replace(AUTHOR_NAME, f"<strong>{AUTHOR_NAME}</strong>")
    title = html.escape(pub["title"].strip())
    if title.endswith(".") and not title.endswith("..."):
        title = title[:-1]
    journal = html.escape(tidy_journal(pub["journal"]))
    doi = pub.get("doi")
    doi_html = (
        f' · <a href="https://doi.org/{html.escape(doi)}" target="_blank" rel="noopener"'
        f' class="pub__doi">DOI</a>'
        if doi else ""
    )
    position = pub.get("author_position", "")
    role = "first" if position in ("1", "1st") else "last" if position == "last" else "co"
    attrs = (
        f' data-themes="{" ".join(pub.get("themes", []))}"'
        f' data-position="{role}"'
        + (' data-featured="true"' if pub.get("featured") else "")
    )
    return f'''                <article class="pub"{attrs}>
                    <span class="pub__year">{pub["year"]}</span>
                    <div class="pub__body">
                        <h4 class="pub__title">
                            <a href="https://pubmed.ncbi.nlm.nih.gov/{pub["pmid"]}/" target="_blank" rel="noopener">{title}</a>
                        </h4>
                        <p class="pub__meta">
                            {authors} · {journal}{doi_html}
                        </p>
                    </div>
                </article>
'''


def render_list(publications):
    visible = [p for p in sort_publications(publications) if not p.get("hidden")]
    return "\n".join(render_card(p) for p in visible)


def replace_block(index_html, publications):
    """Remplace tout le contenu entre les marqueurs START/END par la liste régénérée."""
    pattern = re.compile(re.escape(START_MARKER) + r".*?" + re.escape(END_MARKER), re.S)
    if not pattern.search(index_html):
        raise ValueError("Marqueurs de publications introuvables dans index.html")
    block = f"{START_MARKER}\n{render_list(publications)}                {END_MARKER}"
    return pattern.sub(lambda _: block, index_html, count=1)


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    data = json.loads((root / ".agent/publications.json").read_text(encoding="utf-8"))
    index_path = root / "index.html"
    index_path.write_text(replace_block(index_path.read_text(encoding="utf-8"), data["publications"]), encoding="utf-8")
    print(f"index.html régénéré ({sum(not p.get('hidden') for p in data['publications'])} publications affichées)")
