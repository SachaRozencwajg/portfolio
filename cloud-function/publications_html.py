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


def render_card(pub):
    authors = html.escape(pub["authors"]).replace(AUTHOR_NAME, f"<strong>{AUTHOR_NAME}</strong>")
    title = html.escape(pub["title"])
    journal = html.escape(pub["journal"])
    doi = pub.get("doi")
    doi_html = (
        f' · <a href="https://doi.org/{html.escape(doi)}" target="_blank" rel="noopener"'
        f' class="publication-card__doi">DOI</a>'
        if doi else ""
    )
    position = pub.get("author_position", "")
    role = "first" if position in ("1", "1st") else "last" if position == "last" else "co"
    attrs = (
        f' data-themes="{" ".join(pub.get("themes", []))}"'
        f' data-position="{role}"'
        + (' data-featured="true"' if pub.get("featured") else "")
    )
    return f'''                <article class="publication-card"{attrs}>
                    <div class="publication-card__year">{pub["year"]}</div>
                    <div class="publication-card__content">
                        <a href="https://pubmed.ncbi.nlm.nih.gov/{pub["pmid"]}/" target="_blank" rel="noopener">
                            <h3 class="publication-card__title">
                                {title}
                            </h3>
                        </a>
                        <p class="publication-card__authors">
                            {authors}
                        </p>
                        <p class="publication-card__journal">
                            <em>{journal}</em>{doi_html}
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
