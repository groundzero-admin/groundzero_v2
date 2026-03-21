import {
  type CompetencyInfo,
  type PillarInfo,
  type CapabilityInfo,
  type SkillGraph,
} from "@/api/hooks/useCompetencies";
import {
  type GraphNode,
  type GraphLink,
  type PillarBox,
  NODE_W,
  NODE_H,
  COL_GAP,
  ROW_GAP,
  CAP_GAP,
  PILLAR_PAD_X,
  PILLAR_PAD_Y,
  PILLAR_GAP,
  HEADER_H,
} from "./skillGraphTypes";

export interface GraphLayout {
  nodes: GraphNode[];
  links: GraphLink[];
  nodeMap: Map<string, GraphNode>;
  pillarBoxes: PillarBox[];
  pillars: PillarInfo[];
}

export function buildLayout(data: SkillGraph): GraphLayout {
  const pMap = new Map<string, PillarInfo>();
  for (const p of data.pillars) pMap.set(p.id, p);
  const cMap = new Map<string, CapabilityInfo>();
  for (const c of data.capabilities) cMap.set(c.id, c);
  void cMap; // used only for grouping below

  const pillarOrder = data.pillars.map((p) => p.id);
  const capsByPillar = new Map<string, CapabilityInfo[]>();
  for (const cap of data.capabilities) {
    const list = capsByPillar.get(cap.pillar_id) ?? [];
    list.push(cap);
    capsByPillar.set(cap.pillar_id, list);
  }
  const compsByCap = new Map<string, CompetencyInfo[]>();
  for (const c of data.competencies) {
    const list = compsByCap.get(c.capability_id) ?? [];
    list.push(c);
    compsByCap.set(c.capability_id, list);
  }

  const allNodes: GraphNode[] = [];
  const nMap = new Map<string, GraphNode>();
  const boxes: PillarBox[] = [];

  let cursorX = 0;
  let maxH = 0;
  const COLS = 3;

  for (const pId of pillarOrder) {
    const pillar = pMap.get(pId)!;
    const caps = capsByPillar.get(pId) ?? [];
    let cursorY = PILLAR_PAD_Y + HEADER_H;
    const pillarW = COLS * NODE_W + (COLS - 1) * COL_GAP + PILLAR_PAD_X * 2;

    for (const cap of caps) {
      const comps = compsByCap.get(cap.id) ?? [];
      if (!comps.length) continue;
      cursorY += 28;
      for (let i = 0; i < comps.length; i++) {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = cursorX + PILLAR_PAD_X + col * (NODE_W + COL_GAP);
        const y = cursorY + row * (NODE_H + ROW_GAP);
        const c = comps[i]!;
        const node: GraphNode = {
          id: c.id,
          name: c.name,
          description: c.description,
          assessment_method: c.assessment_method,
          capability_id: c.capability_id,
          pillarId: pId,
          pillarColor: pillar.color,
          pillarName: pillar.name,
          capabilityName: cap.name,
          x,
          y,
        };
        allNodes.push(node);
        nMap.set(c.id, node);
      }
      const rows = Math.ceil(comps.length / COLS);
      cursorY += rows * (NODE_H + ROW_GAP) + CAP_GAP;
    }

    const pillarH = cursorY + PILLAR_PAD_Y;
    boxes.push({
      pillarId: pId,
      color: pillar.color,
      name: pillar.name,
      x: cursorX,
      y: 0,
      w: pillarW,
      h: pillarH,
    });
    if (pillarH > maxH) maxH = pillarH;
    cursorX += pillarW + PILLAR_GAP;
  }

  for (const b of boxes) b.h = maxH;

  const allLinks: GraphLink[] = [];
  const nodeIdSet = new Set(allNodes.map((n) => n.id));
  for (const e of data.prerequisite_edges) {
    if (nodeIdSet.has(e.source_id) && nodeIdSet.has(e.target_id))
      allLinks.push({ sourceId: e.source_id, targetId: e.target_id, type: "prerequisite" });
  }
  for (const e of data.codevelopment_edges) {
    if (nodeIdSet.has(e.source_id) && nodeIdSet.has(e.target_id))
      allLinks.push({ sourceId: e.source_id, targetId: e.target_id, type: "codevelopment" });
  }

  return { nodes: allNodes, links: allLinks, nodeMap: nMap, pillarBoxes: boxes, pillars: data.pillars };
}
