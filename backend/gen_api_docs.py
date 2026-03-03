"""Generate API reference markdown from the OpenAPI spec."""
import json, urllib.request

resp = urllib.request.urlopen("http://localhost:8000/openapi.json")
spec = json.loads(resp.read())
paths = spec["paths"]
schemas = spec.get("components", {}).get("schemas", {})

lines = []
w = lines.append


def resolve_ref(ref_or_schema):
    if isinstance(ref_or_schema, dict) and "$ref" in ref_or_schema:
        name = ref_or_schema["$ref"].split("/")[-1]
        return name, schemas.get(name, {})
    return None, ref_or_schema


def schema_to_table(sch):
    rows = []
    props = sch.get("properties", {})
    required = set(sch.get("required", []))
    for field, fdef in props.items():
        if "anyOf" in fdef:
            types = []
            for option in fdef["anyOf"]:
                ref_name, resolved = resolve_ref(option)
                if ref_name:
                    types.append(ref_name)
                elif resolved.get("type") == "null":
                    types.append("null")
                else:
                    types.append(resolved.get("type", "?"))
            ftype = " \\| ".join(types)
        elif "$ref" in fdef:
            ftype = fdef["$ref"].split("/")[-1]
        elif fdef.get("type") == "array":
            items = fdef.get("items", {})
            ref_name, _ = resolve_ref(items)
            inner = ref_name if ref_name else items.get("type", "?")
            ftype = f"{inner}[]"
        else:
            ftype = fdef.get("type", "?")
            if fdef.get("format"):
                ftype += f" ({fdef['format']})"
        req = "Yes" if field in required else "No"
        note_parts = []
        if "default" in fdef:
            note_parts.append(f"default: `{fdef['default']}`")
        if "minimum" in fdef:
            note_parts.append(f"min: {fdef['minimum']}")
        if "maximum" in fdef:
            note_parts.append(f"max: {fdef['maximum']}")
        for k in ("ge", "le"):
            if k in fdef:
                note_parts.append(f"{k}: {fdef[k]}")
        if "pattern" in fdef:
            note_parts.append(f"pattern: `{fdef['pattern']}`")
        if "enum" in fdef:
            note_parts.append(f"enum: {fdef['enum']}")
        note = ", ".join(note_parts)
        rows.append(f"| `{field}` | `{ftype}` | {req} | {note} |")
    return rows


# ── Header ──
w("# Ground Zero API Reference")
w("")
w("**Base URL:** `http://localhost:8000`  ")
w("")
w("> Swagger UI: http://localhost:8000/docs  ")
w("> ReDoc: http://localhost:8000/redoc")
w("")
w("---")
w("")

# ── Group by tag ──
by_tag = {}
for path, methods in sorted(paths.items()):
    for method, details in methods.items():
        tags = details.get("tags", ["other"])
        for tag in tags:
            by_tag.setdefault(tag, []).append((method.upper(), path, details))

# ── Count endpoints ──
total_endpoints = sum(len(eps) for eps in by_tag.values())

# ── TOC ──
w("## Endpoints")
w("")
w(f"**Total:** {total_endpoints} endpoints | **Schemas:** {len(schemas)}")
w("")
w("| # | Name | Method | Path | Tag |")
w("|---|------|--------|------|-----|")
n = 0
for tag in sorted(by_tag.keys()):
    for method, path, details in by_tag[tag]:
        n += 1
        summary = details.get("summary", "—")
        w(f"| {n} | {summary} | `{method}` | `{path}` | {tag} |")
w("")
w("---")
w("")

# ── Endpoints detail ──
for tag in sorted(by_tag.keys()):
    endpoints = by_tag[tag]
    w(f"## {tag.replace('-', ' ').title()}")
    w("")

    for method, path, details in endpoints:
        summary = details.get("summary", "")
        description = details.get("description", "")
        if summary:
            w(f"### {summary}")
            w(f"`{method} {path}`")
        else:
            w(f"### `{method} {path}`")
        w("")
        if description:
            w(f"> {description}")
            w("")

        # Path params
        path_params = [p for p in details.get("parameters", []) if p.get("in") == "path"]
        query_params = [p for p in details.get("parameters", []) if p.get("in") == "query"]

        if path_params:
            w("**Path Parameters**")
            w("")
            w("| Param | Type |")
            w("|-------|------|")
            for p in path_params:
                ptype = p.get("schema", {}).get("type", "string")
                fmt = p.get("schema", {}).get("format", "")
                if fmt:
                    ptype += f" ({fmt})"
                w(f"| `{p['name']}` | `{ptype}` |")
            w("")

        if query_params:
            w("**Query Parameters**")
            w("")
            w("| Param | Type | Required | Default | Constraints |")
            w("|-------|------|----------|---------|-------------|")
            for p in query_params:
                sch = p.get("schema", {})
                ptype = sch.get("type", "string")
                fmt = sch.get("format", "")
                if fmt:
                    ptype += f" ({fmt})"
                req = p.get("required", False)
                default = sch.get("default", "—")
                cons = []
                for k, label in [("maximum", "max"), ("le", "<="), ("minimum", "min"), ("ge", ">=")]:
                    if k in sch:
                        cons.append(f"{label} {sch[k]}")
                if "pattern" in sch:
                    cons.append(f"pattern: `{sch['pattern']}`")
                w(f"| `{p['name']}` | `{ptype}` | {req} | `{default}` | {', '.join(cons)} |")
            w("")

        # Request body
        req_body = details.get("requestBody", {})
        if req_body:
            content = req_body.get("content", {}).get("application/json", {})
            body_schema = content.get("schema", {})
            ref_name, resolved = resolve_ref(body_schema)
            w(f"**Request Body** `{ref_name or 'object'}`")
            w("")
            w("| Field | Type | Required | Notes |")
            w("|-------|------|----------|-------|")
            for row in schema_to_table(resolved):
                w(row)
            w("")

        # Response
        responses = details.get("responses", {})
        for code, resp_detail in sorted(responses.items()):
            if not code.startswith("2"):
                continue
            resp_content = resp_detail.get("content", {}).get("application/json", {})
            resp_schema = resp_content.get("schema", {})
            if not resp_schema:
                w(f"**Response `{code}`:** _(empty)_")
                w("")
                continue
            ref_name, resolved = resolve_ref(resp_schema)

            if resp_schema.get("type") == "array":
                items = resp_schema.get("items", {})
                item_ref, item_resolved = resolve_ref(items)
                w(f"**Response `{code}`** `{item_ref or 'object'}[]`")
                w("")
                w("| Field | Type | Required | Notes |")
                w("|-------|------|----------|-------|")
                for row in schema_to_table(item_resolved):
                    w(row)
            elif ref_name:
                w(f"**Response `{code}`** `{ref_name}`")
                w("")
                w("| Field | Type | Required | Notes |")
                w("|-------|------|----------|-------|")
                for row in schema_to_table(resolved):
                    w(row)
            else:
                w(f"**Response `{code}`**")
            w("")

        w("---")
        w("")

# ── Schemas ──
w("## Schemas")
w("")
for name in sorted(schemas.keys()):
    sch = schemas[name]
    props = sch.get("properties", {})
    if not props:
        continue
    w(f"### `{name}`")
    w("")
    w("| Field | Type | Required | Notes |")
    w("|-------|------|----------|-------|")
    for row in schema_to_table(sch):
        w(row)
    w("")

output = "\n".join(lines)
print(output)

# Also write to file
with open("/Users/arpit.goel/frontend-projects/groundzero/backend/API_REFERENCE.md", "w") as f:
    f.write(output)
print("\n\n>>> Written to backend/API_REFERENCE.md")
