"use client";

import { useMemo, useState } from "react";

type QaEntry = {
  question: string;
  answer: string;
};

export default function Home() {
  const [question, setQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState<QaEntry[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);

  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const context = useMemo(() => {
    if (!qaHistory.length) return "";
    return qaHistory
      .map((entry, index) => `Q${index + 1}: ${entry.question}\nA${index + 1}: ${entry.answer}`)
      .join("\n\n");
  }, [qaHistory]);

  const handleAsk = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;
    setQaLoading(true);
    setQaError(null);

    try {
      const response = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), context }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error ?? "Unknown error");
      }

      const { answer } = await response.json();

      setQaHistory((current) => [
        ...current,
        { question: question.trim(), answer },
      ]);
      setQuestion("");
    } catch (error) {
      setQaError(error instanceof Error ? error.message : "Unable to get a response.");
    } finally {
      setQaLoading(false);
    }
  };

  const handleGenerateVideo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!videoPrompt.trim()) return;

    setVideoLoading(true);
    setVideoError(null);
    setVideoUrl(null);

    try {
      const response = await fetch("/api/text-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: videoPrompt.trim() }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error ?? "Unknown error");
      }

      const { videoUrl: generatedUrl } = await response.json();
      setVideoUrl(generatedUrl);
    } catch (error) {
      setVideoError(error instanceof Error ? error.message : "Unable to generate video.");
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <section>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Agentic Studio
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-300">
            Ask anything and generate AI-powered answers. Craft cinematic ideas and render short clips with text-to-video synthesis powered by state-of-the-art diffusion models.
          </p>
        </section>

        <section className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col rounded-3xl border border-white/5 bg-white/5 shadow-lg shadow-black/30">
            <div className="border-b border-white/10 p-6">
              <h2 className="text-2xl font-semibold">Conversational Q&amp;A Agent</h2>
              <p className="mt-2 text-sm text-slate-300">
                Keep a running dialogue with a knowledgeable assistant. Previous exchanges are used as context to ground future answers.
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-6 p-6">
              <form onSubmit={handleAsk} className="flex flex-col gap-4">
                <label className="text-sm font-medium text-slate-200" htmlFor="question">
                  Ask a question
                </label>
                <textarea
                  id="question"
                  name="question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="e.g. Explain the difference between supervised and unsupervised learning."
                  className="min-h-[120px] rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                />
                <button
                  type="submit"
                  disabled={qaLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {qaLoading ? "Thinking..." : "Get Answer"}
                </button>
              </form>

              {qaError && (
                <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {qaError}
                </p>
              )}

              <div className="flex flex-1 flex-col gap-4 overflow-hidden">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Conversation
                </h3>
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-white/5 bg-black/40 p-4">
                  {qaHistory.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Ask your first question to begin the conversation.
                    </p>
                  ) : (
                    qaHistory.map((entry, index) => (
                      <div
                        key={`${entry.question}-${index}`}
                        className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4"
                      >
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                            Question
                          </span>
                          <p className="mt-1 text-sm text-slate-100">{entry.question}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                            Answer
                          </span>
                          <p className="mt-1 text-sm text-slate-100 leading-relaxed whitespace-pre-line">
                            {entry.answer}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-3xl border border-white/5 bg-white/5 shadow-lg shadow-black/30">
            <div className="border-b border-white/10 p-6">
              <h2 className="text-2xl font-semibold">Text-to-Video Generator</h2>
              <p className="mt-2 text-sm text-slate-300">
                Describe a scene and let the model synthesize a short cinematic clip. Longer prompts lead to richer motion.
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-6 p-6">
              <form onSubmit={handleGenerateVideo} className="flex flex-col gap-4">
                <label className="text-sm font-medium text-slate-200" htmlFor="video-prompt">
                  Creative brief
                </label>
                <textarea
                  id="video-prompt"
                  name="video-prompt"
                  value={videoPrompt}
                  onChange={(event) => setVideoPrompt(event.target.value)}
                  placeholder="e.g. A timelapse of a futuristic city skyline transitioning from sunset to a neon-lit night."
                  className="min-h-[150px] rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40"
                />
                <button
                  type="submit"
                  disabled={videoLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {videoLoading ? "Rendering..." : "Generate Video"}
                </button>
              </form>

              {videoError && (
                <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {videoError}
                </p>
              )}

              {videoLoading && (
                <p className="text-sm text-slate-300">
                  The model is rendering your video. This usually takes 20-40 seconds.
                </p>
              )}

              {videoUrl && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Generated clip
                  </h3>
                  <video
                    className="w-full rounded-2xl border border-white/10 bg-black"
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                  />
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200"
                  >
                    Download video
                    <span aria-hidden>↗</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
