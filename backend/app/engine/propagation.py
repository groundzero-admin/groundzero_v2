"""Prerequisite propagation helpers for FIRe (Fractional Implicit Repetition)."""

from collections import deque

from app.engine.types import PrerequisiteLink


def build_prerequisite_ancestor_map(
    edges: list[dict],
    competency_id: str,
    max_hops: int = 3,
    hop_decay: float = 0.5,
) -> list[PrerequisiteLink]:
    """BFS backward through prerequisite edges to find ancestors.

    An edge {source_id: A, target_id: B} means A is a prerequisite of B.
    So to find ancestors of `competency_id`, we follow edges where target_id == current node,
    and the ancestor is source_id.

    Returns list of PrerequisiteLink with weight = encompassing_weight * hop_decay^(depth-1).
    """
    # Build adjacency: target -> list of (source, encompassing_weight)
    reverse_adj: dict[str, list[tuple[str, float]]] = {}
    for e in edges:
        reverse_adj.setdefault(e["target_id"], []).append(
            (e["source_id"], e.get("encompassing_weight", 0.0))
        )

    visited: set[str] = {competency_id}
    result: list[PrerequisiteLink] = []
    queue: deque[tuple[str, int, float]] = deque()  # (node, depth, cumulative_weight)

    # Seed BFS from the competency's direct prerequisites
    for source, ew in reverse_adj.get(competency_id, []):
        if source not in visited:
            queue.append((source, 1, ew))
            visited.add(source)

    while queue:
        node, depth, cum_weight = queue.popleft()
        if cum_weight > 0.01:  # skip negligible weights
            result.append(PrerequisiteLink(
                linked_competency_id=node,
                depth=depth,
                weight=cum_weight,
            ))

        if depth < max_hops:
            for source, ew in reverse_adj.get(node, []):
                if source not in visited:
                    visited.add(source)
                    queue.append((source, depth + 1, cum_weight * hop_decay))

    return result


