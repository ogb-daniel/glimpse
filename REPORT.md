# Glimpse — ADTC 2026 Submission Report

## 1. Problem Definition
The Africa Deep Tech Challenge explicitly targets on-device AI for democratized access. Across Africa, self-learners, researchers, and professionals spend hours reading dense material on the web. They constantly encounter terms they don't fully understand. The current reflex is to copy the text, open a new tab, query a cloud-based AI, and lose their context—assuming they have a stable internet connection and the data bandwidth to sustain the query loop.

**Glimpse** solves this by putting an AI tutor directly into the browser. By leveraging Chrome's built-in on-device AI (Gemini Nano), we completely eliminate the need for cloud infrastructure, API fees, network latency, and privacy risks.

## 2. Hardware & Architecture Constraints
The core ADTC challenge targets an 8 GB standard laptop with integrated graphics running Ubuntu. However, Glimpse fundamentally differs from standard challenge submissions:

- **No Standalone GGUF Model:** We did not quantize and ship our own model file to be executed via `llama.cpp`. Instead, Glimpse uses the **Chrome Prompt API**, utilizing Chrome's built-in Gemini Nano model.
- **Model Orchestration:** Memory, loading, scaling, and execution of the model are intrinsically managed by Chrome. 
- **Manifest V3 Constraints:** Because Chrome extensions are tightly restricted in Manifest V3 (MV3), all background execution runs in ephemeral Service Workers. This poses a significant hurdle for maintaining a persistent stream of AI tokens.

## 3. Design Decisions
To deliver an elegant, immediate, and fully local experience within the browser, we made several critical architectural choices:

1. **Magic Hold Gesture:** To minimize UI friction, we bypassed context menus and hotkeys. Highlighting text and holding the mouse button for 1.5s immediately reveals the "Tactical Popover" exactly at the selection point.
2. **Context-Aware Prompting:** Glimpse captures the surrounding 2,000 characters of text, the page URL, and headings (`<h1>` tags) and injects them into the Gemini Nano prompt. This yields high-quality, contextually accurate definitions from a relatively small model.
3. **Port-Based AI Streaming:** Since MV3 Service Workers are ephemeral, we established a long-lived `chrome.runtime.connect` port between the content script and background script, ensuring AI chunks safely stream back to the UI without timing out.
4. **Shadow DOM Isolation:** To prevent Glimpse's UI (fonts, layout, colors) from conflicting with the host webpage, the entire UI tree is securely rendered within a custom Shadow Root (`glimpse-overlays`).
5. **PDF Dual-Path Extraction:** Chrome handles PDFs differently than standard HTML. We built a native `postMessage` bridge for Chrome's `<embed>` PDF viewer, providing seamless support for local and remote PDFs, alongside a `PDF.js` fallback for non-standard viewers.
6. **Codex Underlining with Density Limits:** Previously queried terms are saved locally and automatically underlined when encountered on new pages. To prevent DOM bloat, we strictly enforce an `IntersectionObserver` limit of 10 active underlines per viewport.
7. **Local-First Identity:** Upon installation, the extension generates a secure Ed25519 keypair using the Web Crypto API, storing it locally. There are no external accounts or databases.

## 4. Tools Used
- **Framework:** WXT (Vite 8 + React 18 + TypeScript) for modern, fast Manifest V3 multi-surface orchestration.
- **Storage:** Dexie.js (IndexedDB) for local persistence of the user's "Scrapbook" interactions.
- **AI Inference:** Chrome Prompt API (`self.ai.languageModel`).
- **PDF Extraction:** PDF.js (v5.6.x) for web fallback.
- **Testing:** Vitest with `@testing-library/react` and `jsdom`.

## 5. Benchmarks & Evaluation
Because Glimpse relies on Chrome's internal Gemini Nano implementation via the Prompt API, **it is not compatible with the `adtc-profiler` tool**, which expects a standalone GGUF file and `llama-bench`.

Instead, we manually instrumented our background script and monitored Chrome Task Manager on target hardware to evaluate our performance against the ADTC rubric:

### 5.1 Throughput ($S_{\text{perf}}$)
- **Time to First Token (TTFT):** Highly variable (1.8s to 27s). The Prompt API takes time to handle prompt prefill when passed large context windows (up to 2,000 chars of surrounding text).
- **Tokens Per Second (Generation):** Once the prefill completes, the model generates at a consistently rapid rate.
  - Across multiple manual benchmarks, the average generation speed was **~34 tokens per second (TPS)**.
  - **Self-Reported $S_{\text{perf}}$:** Because 34 TPS exceeds the 15.0 TPS reference ceiling, our speed score naturally caps at **100**.

### 5.2 Efficiency ($S_{\text{eff}}$)
- The extension's direct memory footprint is negligible (~47 MB).
- The heavy lifting is handled invisibly by Chrome's GPU Process, which shares resources dynamically. 
- While total Chrome + Nano overhead runs around 1.5–2.0 GB during inference, this remains well within the 7.0 GB constraint of the ADTC target hardware.
- **Self-Reported $S_{\text{eff}}$:** Calculating `(7.0 - 1.75) / 7.0 * 100`, we arrive at a conservative efficiency score of **75**.

### 5.3 Accuracy ($S_{\text{acc}}$)
We welcome manual assessment using the two provided Test Prompts, which simulate Glimpse's heavily context-grounded prompt templates. The ability to inject dynamic page context allows the relatively small Gemini Nano model to produce definitions on par with much larger models.
