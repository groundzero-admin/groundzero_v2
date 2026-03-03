"""Co-development propagation helpers."""

from app.engine.types import CodevelopmentLink


def build_codevelopment_map(edges: list[dict]) -> dict[str, list[CodevelopmentLink]]:
    """
    Build a map: competency_id -> list of CodevelopmentLink.
    Edges are bidirectional, so each edge produces two map entries.

    Args:
        edges: list of dicts with keys source_id, target_id, transfer_weight
    """
    result: dict[str, list[CodevelopmentLink]] = {}
    for edge in edges:
        a = edge["source_id"]
        b = edge["target_id"]
        w = edge["transfer_weight"]

        result.setdefault(a, []).append(CodevelopmentLink(linked_competency_id=b, transfer_weight=w))
        result.setdefault(b, []).append(CodevelopmentLink(linked_competency_id=a, transfer_weight=w))

    return result
