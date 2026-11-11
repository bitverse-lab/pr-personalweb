/// <reference lib="webworker" />
// Sentence embeddings in the visitor's browser (transformers.js + a small MiniLM model), so a job
// description can be matched by meaning without being sent anywhere. Loaded only when asked for.
// The library comes from a pinned CDN build rather than npm: the npm package pulls native Node
// dependencies (onnxruntime-node, sharp) this site never uses.
// "+esm" rewrites the library's bare imports (onnxruntime-web) to CDN URLs a worker can load.
// shortcut: jsDelivr resolves onnxruntime-common unpinned inside it; self-host the bundle if that ever breaks.
const LIB = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/+esm";
const MODEL = "Xenova/all-MiniLM-L6-v2";

export type EmbedRequest = { type: "init" } | { type: "embed"; id: number; texts: string[] };
export type EmbedResponse =
  | { type: "progress"; loaded: number; total: number }
  | { type: "ready" }
  | { type: "vectors"; id: number; vectors: number[][] }
  | { type: "error"; message: string };

type Extractor = (texts: string[], options: { pooling: "mean"; normalize: boolean }) => Promise<{ tolist(): number[][] }>;
interface TransformersLib {
  env: { allowLocalModels: boolean };
  pipeline(task: "feature-extraction", model: string, options: object): Promise<Extractor>;
}

let extractor: Extractor | null = null;
const send = (m: EmbedResponse) => postMessage(m);
const files = new Map<string, { loaded: number; total: number }>();

self.onmessage = async (e: MessageEvent<EmbedRequest>) => {
  try {
    if (e.data.type === "init") {
      const lib = (await import(/* webpackIgnore: true */ LIB)) as TransformersLib;
      lib.env.allowLocalModels = false;
      extractor = await lib.pipeline("feature-extraction", MODEL, {
        dtype: "q8",
        progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
          if (p.status !== "progress" || !p.file) return;
          files.set(p.file, { loaded: p.loaded ?? 0, total: p.total ?? 0 });
          const all = Array.from(files.values());
          send({ type: "progress", loaded: all.reduce((s, f) => s + f.loaded, 0), total: all.reduce((s, f) => s + f.total, 0) });
        },
      });
      send({ type: "ready" });
    } else if (extractor) {
      const output = await extractor(e.data.texts, { pooling: "mean", normalize: true });
      send({ type: "vectors", id: e.data.id, vectors: output.tolist() });
    }
  } catch (err) {
    send({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
