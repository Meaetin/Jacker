# Codebase Graph

A knowledge graph of this codebase lives in `graphify-out/`. Use it before touching unfamiliar areas.

- **`graphify-out/graph.html`** — interactive visualization, open in any browser. Nodes are colored by community; click any node to see its connections.
- **`graphify-out/GRAPH_REPORT.md`** — communities, god nodes, surprising connections, knowledge gaps. This is the generated source of truth; read it rather than a copy pasted elsewhere.
- **`graphify-out/graph.json`** — raw graph data for programmatic queries.

## Query the graph before searching the codebase

**Before using Grep, Glob, or Read to find code**, query the graph first:

1. Run `/graphify query "<what you're looking for>"` to find relevant nodes and their source files.
2. Use the returned `source_file` and `source_location` to go directly to the right file.
3. Only fall back to Grep/Glob if the graph returns no useful matches.

This applies to: finding where a feature lives, tracing a data flow, locating a component, understanding what calls what.

## Commands

- Query: `/graphify query "<question>"`
- Explain one node: `/graphify explain "<node name>"`
- Rebuild after code changes: `/graphify . --update`

The highest-betweenness nodes — the ones to touch carefully — are listed in `GRAPH_REPORT.md` under god nodes. Re-read it after `--update` rather than trusting a remembered list.
