---
name: rag-architectures
description: >-
  The five production RAG (retrieval-augmented generation) architectures that
  replace naive chunk->embed->top-k->stuff: Hybrid RAG, GraphRAG, Agentic RAG,
  Corrective RAG (CRAG), and Multimodal RAG. USE THIS when designing, choosing,
  or debugging a retrieval pipeline — deciding which RAG pattern fits a use case,
  why naive top-k is underperforming, how to add keyword+vector fusion, knowledge
  graphs, agentic tool-routing, retrieval grading, or text+image+table retrieval.
  Encodes each pattern's flow, when to reach for it, and its trade-offs.
---

# RAG Architectures — 5 production patterns

Naive RAG (chunk -> embed -> top-k -> stuff the prompt) is fine for demos but weak
in production: it retrieves on dense similarity alone, can't grade what it pulled,
can't plan multi-step lookups, and ignores structure. The five patterns below fix
specific failure modes. They compose — real systems mix them.

Source: Brij Kishore Pandey's "Top 5 RAG Architectures (2026)". A creator's
summary; the patterns are standard, but validate specifics against current
library docs (LlamaIndex, LangChain/LangGraph, etc.) when implementing.

---

## 01 — Hybrid RAG  ("dense vectors meet sparse keywords")
**Flow:** Query -> (a) Embedding model -> Vector DB -> dense results; (b) BM25
index -> sparse results -> **Reciprocal Rank Fusion** -> Top-K chunks -> LLM ->
Answer.
- **Fixes:** pure-vector retrieval misses exact terms (IDs, error codes, names,
  rare jargon); pure-keyword misses paraphrase/semantics. RRF merges both rankings.
- **Use when:** general-purpose retrieval, especially mixed natural-language +
  exact-match queries. **This is the sensible default upgrade from naive RAG.**
- **Cost:** maintain two indexes; tune the fusion weighting.

## 02 — GraphRAG  ("answers live in the relationships")
**Flow:** Query -> Entity extractor -> Knowledge Graph (nodes = entities, edges =
relationships) -> Subgraph retrieval -> Community summaries -> LLM -> Answer.
- **Fixes:** questions whose answer is a *relationship* or requires connecting
  facts across many documents — naive top-k returns disconnected chunks and
  can't "join."
- **Use when:** multi-hop reasoning, "how is X connected to Y," global/corpus-wide
  questions ("what are the main themes"), compliance/org/knowledge-base graphs.
- **Cost:** graph construction + entity/relation extraction is expensive to build
  and keep fresh; overkill for simple lookups.

## 03 — Agentic RAG  ("retrieval becomes a plan, not a step")
**Flow:** Query -> Planner agent -> routes to tools (Vector search / Web search /
SQL database / ...) -> **agent loops until confident** -> Reasoner agent -> Final
answer.
- **Fixes:** a single retrieval pass can't answer questions that need multiple
  sources, decomposition, or live data. The agent decides *what* to retrieve,
  *from where*, and *when it's done*.
- **Use when:** heterogeneous sources, multi-step questions, tool use (SQL + docs
  + web), or when "do I even need to retrieve?" should be a decision.
- **Cost:** latency, token spend, and nondeterminism; needs loop guards
  (max iterations) and good tool descriptions. Hardest to evaluate.

## 04 — Corrective RAG / CRAG  ("grade the retrieval before you trust it")
**Flow:** Query -> Retriever -> Retrieved docs -> **Evaluator/Grader** -> branch:
- **CORRECT** -> LLM -> Answer
- **AMBIGUOUS** -> Query rewriter -> retrieve again
- **INCORRECT** -> Web-search fallback -> LLM -> Answer.
- **Fixes:** the silent failure mode of RAG — confidently answering from
  irrelevant/low-quality chunks. CRAG adds a relevance gate + recovery path.
- **Use when:** accuracy/faithfulness matters and bad retrieval is worse than
  "let me search the web" or a rewrite. Cheap, high-leverage reliability add-on.
- **Cost:** extra grader call per query; need a fallback source for INCORRECT.

## 05 — Multimodal RAG  ("one index across text, images, and tables")
**Flow:** Text chunks + Images/charts + Tables -> **shared multimodal embedding
model** (e.g. CLIP / ColPali) -> unified vector index -> retrieval -> multimodal
LLM (vision + text) -> Answer.
- **Fixes:** text-only RAG is blind to diagrams, screenshots, scanned PDFs,
  charts, and table structure.
- **Use when:** corpora with figures/tables/scans — financial reports, manuals,
  slides, product catalogs, medical/technical docs.
- **Cost:** multimodal embedding + a vision-capable LLM; table/layout parsing is
  fiddly; bigger/cost-heavier index.

---

## Picking one (fast triage)
- Naive top-k underperforms on exact terms -> **Hybrid**.
- Answer requires connecting facts / multi-hop / "global" questions -> **GraphRAG**.
- Needs multiple sources, tools, or decomposition -> **Agentic**.
- Retrieval quality is unreliable / faithfulness is critical -> **CRAG**.
- Content includes images, charts, tables, scans -> **Multimodal**.

They stack: e.g. **Hybrid retrieval + CRAG grading** is a strong, cheap baseline;
add **Agentic** routing when sources multiply; add **Multimodal** when the data
isn't pure text.
