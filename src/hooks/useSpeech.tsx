import { useCallback, useEffect, useRef, useState } from "react";

// ---------- Speech Recognition (Dictation) ----------
type SR = any;

export function useDictation(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
  }, []);

  const start = useCallback((lang = "en-IN") => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec: SR = new SpeechRecognition();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + " ";
        else interim += t;
      }
      onResult((finalText + interim).trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [onResult]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { start, stop, listening, supported };
}

// ---------- Speech Synthesis (Pronunciation) ----------
export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported]);

  const speak = useCallback(
    (text: string, lang = "en-IN", voiceURI?: string, rate = 1) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      const v = voiceURI
        ? window.speechSynthesis.getVoices().find((x) => x.voiceURI === voiceURI)
        : undefined;
      if (v) u.voice = v;
      u.rate = rate;
      u.pitch = 1;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(u);
    },
    [supported],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { speak, stop, speaking, supported, voices };
}

// ---------- Speech-friendly text normalization ----------
// Turns markdown answers into something a teacher would naturally say aloud:
// expands abbreviations, pronounces math/chemistry symbols, reads URLs cleanly,
// and replaces markdown formatting with natural pauses.

const ABBREVIATIONS: Array<[RegExp, string]> = [
  [/\bDr\.\b/g, "Doctor"],
  [/\bMr\.\b/g, "Mister"],
  [/\bMrs\.\b/g, "Misses"],
  [/\bMs\.\b/g, "Miss"],
  [/\bProf\.\b/g, "Professor"],
  [/\bSt\.\b/g, "Saint"],
  [/\bvs\.?\b/gi, "versus"],
  [/\betc\.\b/gi, "etcetera"],
  [/\bi\.e\.\b/gi, "that is"],
  [/\be\.g\.\b/gi, "for example"],
  [/\bw\.r\.t\.\b/gi, "with respect to"],
  [/\bapprox\.\b/gi, "approximately"],
  [/\bno\.\b/gi, "number"],
  [/\bNCERT\b/g, "N C E R T"],
  [/\bCBSE\b/g, "C B S E"],
  [/\bAI\b/g, "A I"],
  [/\bIT\b/g, "I T"],
  [/\bSQL\b/g, "S Q L"],
  [/\bHTML\b/g, "H T M L"],
  [/\bCSS\b/g, "C S S"],
  [/\bAPI\b/g, "A P I"],
  [/\bURL\b/g, "U R L"],
  [/\bDNA\b/g, "D N A"],
  [/\bRNA\b/g, "R N A"],
  [/\bUSA\b/g, "U S A"],
  [/\bUK\b/g, "U K"],
  [/\bUN\b/g, "U N"],
  [/\bGK\b/g, "general knowledge"],
];

const SYMBOLS: Array<[RegExp, string]> = [
  [/π/g, " pi "],
  [/√/g, " square root of "],
  [/∑/g, " sum of "],
  [/∫/g, " integral of "],
  [/∞/g, " infinity "],
  [/°/g, " degrees "],
  [/±/g, " plus or minus "],
  [/≈/g, " approximately equal to "],
  [/≠/g, " not equal to "],
  [/≤/g, " less than or equal to "],
  [/≥/g, " greater than or equal to "],
  [/→/g, " gives "],
  [/←/g, " from "],
  [/⇌|⇋/g, " in equilibrium with "],
  [/×/g, " times "],
  [/÷/g, " divided by "],
  [/%/g, " percent "],
  [/&/g, " and "],
  [/\$/g, " dollars "],
  [/€/g, " euros "],
  [/£/g, " pounds "],
  [/₹/g, " rupees "],
  [/\^(\d+)/g, " to the power $1 "],
  [/(\d)\s*\/\s*(\d)/g, "$1 over $2"],
  [/(\d)\s*\*\s*(\d)/g, "$1 times $2"],
  [/(\d)\s*-\s*(\d)/g, "$1 minus $2"],
  [/(\d)\s*\+\s*(\d)/g, "$1 plus $2"],
  [/(\d)\s*=\s*(\d)/g, "$1 equals $2"],
];

function urlToSpeech(url: string): string {
  try {
    const u = new URL(url);
    return ` link to ${u.hostname.replace(/^www\./, "").replace(/\./g, " dot ")} `;
  } catch {
    return ` link `;
  }
}

export function stripForSpeech(md: string): string {
  if (!md) return "";
  let t = md;

  // Remove fenced code blocks and inline code (diagrams/code aren't spoken).
  t = t.replace(/```[\s\S]*?```/g, ". ");
  t = t.replace(/`([^`]+)`/g, "$1");

  // Images: drop, but keep alt as a brief mention.
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_m, alt) => (alt ? ` image of ${alt}. ` : " "));

  // Links: replace [text](url) with text, then "link to host".
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => `${text}, ${urlToSpeech(url)}`);

  // Bare URLs.
  t = t.replace(/https?:\/\/\S+/g, (m) => urlToSpeech(m));

  // Headings → sentence + pause.
  t = t.replace(/^#{1,6}\s*(.+)$/gm, "$1. ");

  // Blockquotes / list markers / emphasis chars.
  t = t.replace(/^\s{0,3}>\s?/gm, "");
  t = t.replace(/^\s*[-*+]\s+/gm, ". ");
  t = t.replace(/^\s*\d+\.\s+/gm, (m) => `${m.trim().replace(/\./, "")}. `);
  t = t.replace(/(\*\*|__)(.*?)\1/g, "$2");
  t = t.replace(/(\*|_)(.*?)\1/g, "$2");
  t = t.replace(/~~(.*?)~~/g, "$1");

  // Tables → flatten pipes to commas.
  t = t.replace(/\|/g, ", ");
  t = t.replace(/^\s*[:\-,\s]+$/gm, "");

  // Horizontal rules.
  t = t.replace(/^\s*([-*_])\1{2,}\s*$/gm, ". ");

  // Symbols and abbreviations.
  for (const [re, rep] of SYMBOLS) t = t.replace(re, rep);
  for (const [re, rep] of ABBREVIATIONS) t = t.replace(re, rep);

  // Paragraph breaks → sentence pauses.
  t = t.replace(/\n{2,}/g, ". ");
  t = t.replace(/\n+/g, ". ");

  // Cleanup punctuation pile-ups and whitespace.
  t = t.replace(/\s+([.,;:!?])/g, "$1");
  t = t.replace(/([.!?])\s*\.+/g, "$1");
  t = t.replace(/([.,;:!?])\1+/g, "$1");
  t = t.replace(/\s{2,}/g, " ").trim();

  return t;
}
