"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  CircleHelp,
  ImagePlus,
  Languages,
  LoaderCircle,
  Mic,
  MicOff,
  PhoneCall,
  Plus,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type ChatLanguage = "hi" | "en";
type MessageRole = "assistant" | "user";
type ProviderStatus = "checking" | "ready" | "unconfigured" | "unavailable";
type ConsentAction = { type: "chat" } | { type: "speech"; messageId: number };

interface ChatMessage {
  id: number;
  role: MessageRole;
  text: string;
  image?: string;
  streaming?: boolean;
}

interface UserSession {
  access_token: string;
  role: string;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

type SpeechRecognitionResultLike = ArrayLike<SpeechRecognitionAlternativeLike>;

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

interface StreamEvent {
  error?: string;
  choices?: Array<{ delta?: { content?: string | null } }>;
}

const INITIAL_MESSAGE: Record<ChatLanguage, string> = {
  hi: "Namaste! Main Sehat Saathi hoon. Aapki baat dhyan se sununga. Kya pareshaani hai, aur yeh kab se ho rahi hai?",
  en: "Hello! I'm Sehat Saathi. I'm here to listen. What has been troubling you, and when did it start?",
};
const SUPPORTED_ROLES = ["PATIENT", "ASHA", "ANM", "DOCTOR", "PHC_STAFF", "PUBLIC_HEALTH_OFFICER"];
const SUGGESTIONS = [
  { hi: "Mujhe bukhar hai", en: "I have a fever" },
  { hi: "Khansi ho rahi hai", en: "I have a cough" },
  { hi: "Doctor ko kab dikhana chahiye?", en: "When should I see a doctor?" },
];

export function SaathiChatScreen() {
  const [language, setLanguage] = useState<ChatLanguage>("hi");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "assistant", text: INITIAL_MESSAGE.hi },
  ]);
  const [draft, setDraft] = useState("");
  const [pendingImage, setPendingImage] = useState("");
  const [chatError, setChatError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [session, setSession] = useState<UserSession | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>("checking");
  const [providerConsent, setProviderConsent] = useState(false);
  const [showProviderConsent, setShowProviderConsent] = useState(false);
  const [consentAction, setConsentAction] = useState<ConsentAction | null>(null);
  const [showSpeechPrivacy, setShowSpeechPrivacy] = useState(false);
  const [voiceLoadingId, setVoiceLoadingId] = useState<number | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [inputError, setInputError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const nextIdRef = useRef(2);
  const isHindi = language === "hi";

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("arogyasaathi_session");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<UserSession>;
        const role = parsed.role;
        if (parsed.access_token && role && SUPPORTED_ROLES.includes(role)) {
          setSession({ access_token: parsed.access_token, role });
        }
      }
    } catch {
      sessionStorage.removeItem("arogyasaathi_session");
    } finally {
      setSessionChecked(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    fetch(`${API_BASE_URL}/saathi/status`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 401 ? "Your sign-in session has expired." : "Could not check AI service status.");
        return response.json() as Promise<{ configured: boolean }>;
      })
      .then((result) => {
        if (active) setProviderStatus(result.configured ? "ready" : "unconfigured");
      })
      .catch((error: unknown) => {
        if (active) {
          setProviderStatus("unavailable");
          setChatError(error instanceof Error ? error.message : "Could not check AI service status.");
        }
      });
    return () => { active = false; };
  }, [session]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    streamAbortRef.current?.abort();
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  function getErrorMessage(response: Response, body: { detail?: unknown }): string {
    if (response.status === 401) return isHindi ? "Aapka session khatam ho gaya. Dobara sign in karein." : "Your session expired. Please sign in again.";
    if (response.status === 429) return isHindi ? "Bahut saare sawaal bheje gaye. Ek minute baad dobara koshish karein." : "Too many requests. Please wait a minute and try again.";
    return (typeof body.detail === "string" ? body.detail : null)
      || (isHindi ? "Jawab nahi aa saka. Kripya dobara koshish karein." : "The assistant could not reply. Please try again.");
  }

  async function playMessageAudio(message: ChatMessage, consentApproved = false) {
    if (!session) return;
    if (!providerConsent && !consentApproved) {
      setConsentAction({ type: "speech", messageId: message.id });
      setShowProviderConsent(true);
      return;
    }
    if (playingMessageId === message.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
      setPlayingMessageId(null);
      return;
    }

    setChatError("");
    setVoiceLoadingId(message.id);
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    try {
      const response = await fetch(`${API_BASE_URL}/saathi/speech`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ consent: true, text: message.text, language }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { detail?: unknown };
        throw new Error(getErrorMessage(response, body));
      }
      const audioUrl = URL.createObjectURL(await response.blob());
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setPlayingMessageId(null);
        audioRef.current = null;
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      };
      setPlayingMessageId(message.id);
      await audio.play();
    } catch (error) {
      setPlayingMessageId(null);
      setChatError(error instanceof Error ? error.message : (isHindi ? "आवाज़ नहीं चल सकी।" : "Could not play the spoken reply."));
    } finally {
      setVoiceLoadingId(null);
    }
  }

  async function sendToAssistant() {
    if (!session || isStreaming) return;
    const text = draft.trim();
    if (!text && !pendingImage) return;

    const image = pendingImage || undefined;
    const userMessage: ChatMessage = {
      id: nextIdRef.current++,
      role: "user",
      text: text || (isHindi ? "Is photo ke baare mein batayein" : "Please tell me about this photo"),
      image,
    };
    const assistantId = nextIdRef.current++;
    const history = messages
      .slice(1)
      .slice(-10)
      .map((message) => ({ role: message.role, content: message.text }));
    const requestMessages = [
      ...history,
      {
        role: "user",
        content: userMessage.text,
        ...(image ? { image_data_url: image } : {}),
      },
    ];

    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "assistant", text: "", streaming: true },
    ]);
    setDraft("");
    setPendingImage("");
    setChatError("");
    setInputError("");
    setIsStreaming(true);
    const controller = new AbortController();
    streamAbortRef.current = controller;

    let reply = "";
    try {
      const response = await fetch(`${API_BASE_URL}/saathi/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({ consent: true, messages: requestMessages }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { detail?: unknown };
        throw new Error(getErrorMessage(response, body));
      }
      if (!response.body) throw new Error(isHindi ? "Live jawab ka connection nahi mila." : "The live reply stream was unavailable.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamFinished = false;
      const consumeEvent = (rawEvent: string) => {
        const data = rawEvent
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("\n");
        if (!data || data === "[DONE]") return;
        const event = JSON.parse(data) as StreamEvent;
        if (event.error) throw new Error(event.error);
        const delta = event.choices?.[0]?.delta?.content;
        if (typeof delta !== "string" || !delta) return;
        reply += delta;
        setMessages((current) => current.map((message) =>
          message.id === assistantId ? { ...message, text: reply } : message,
        ));
      };

      while (!streamFinished) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? "";
        for (const event of events) consumeEvent(event);
        streamFinished = done;
      }
      if (buffer.trim()) consumeEvent(buffer);
      if (!reply.trim()) throw new Error(isHindi ? "खाली जवाब मिला। कृपया दोबारा पूछें।" : "The assistant returned an empty reply. Please try again.");
      setMessages((current) => current.map((message) =>
        message.id === assistantId ? { ...message, streaming: false } : message,
      ));
      if (voiceReplies) {
        const completedReply = { id: assistantId, role: "assistant" as const, text: reply };
        void playMessageAudio(completedReply, true);
      }
    } catch (error) {
      const wasCancelled = error instanceof DOMException && error.name === "AbortError";
      if (!wasCancelled) {
        setChatError(error instanceof Error ? error.message : (isHindi ? "जवाब नहीं आ सका। कृपया दोबारा कोशिश करें।" : "The assistant could not reply. Please try again."));
      }
      setMessages((current) => current.filter((message) => message.id !== assistantId || message.text));
    } finally {
      if (streamAbortRef.current === controller) {
        streamAbortRef.current = null;
        setIsStreaming(false);
      }
    }
  }

  function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!draft.trim() && !pendingImage) return;
    if (!providerConsent) {
      setConsentAction({ type: "chat" });
      setShowProviderConsent(true);
      return;
    }
    void sendToAssistant();
  }

  function handleConsent() {
    const action = consentAction;
    setProviderConsent(true);
    setShowProviderConsent(false);
    setConsentAction(null);
    if (action?.type === "chat") void sendToAssistant();
    if (action?.type === "speech") {
      const message = messages.find((item) => item.id === action.messageId);
      if (message) void playMessageAudio(message, true);
    }
  }

  function startListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const speechWindow = window as SpeechRecognitionWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setInputError(isHindi
        ? "Is browser mein bolkar likhne ki suvidha nahi hai. Chrome mein kholkar dekhein ya type karein."
        : "Speech input is not supported in this browser. Try Chrome or type your message.");
      return;
    }
    setInputError("");
    setShowSpeechPrivacy(true);
  }

  function beginListening() {
    const speechWindow = window as SpeechRecognitionWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    const existingText = draft.trim();
    recognition.lang = isHindi ? "hi-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      setDraft(`${existingText ? `${existingText} ` : ""}${transcript}`.trim());
    };
    recognition.onerror = (event) => {
      setInputError(event.error === "not-allowed"
        ? (isHindi ? "Microphone permission nahi mili. Browser settings mein permission dein." : "Microphone permission was denied. Allow it in your browser settings.")
        : (isHindi ? "Awaaz samajh nahi aayi. Dobara koshish karein ya type karein." : "Speech was not recognized. Try again or type your message."));
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
      setInputError(isHindi ? "Microphone shuru nahi ho saka. Dobara koshish karein." : "Could not start the microphone. Please try again.");
    }
  }

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setInputError(isHindi ? "Sirf JPG, PNG ya WebP photo chunein." : "Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setInputError(isHindi ? "Photo 5 MB se chhoti honi chahiye." : "The image must be smaller than 5 MB.");
      return;
    }

    setInputError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPendingImage(reader.result);
      else setInputError(isHindi ? "Photo kholi nahi ja saki. Dobara chunein." : "Could not read the image. Please choose it again.");
    };
    reader.onerror = () => setInputError(isHindi ? "Photo kholi nahi ja saki. Dobara chunein." : "Could not read the image. Please choose it again.");
    reader.readAsDataURL(file);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function startNewConversation() {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setIsStreaming(false);
    audioRef.current?.pause();
    setMessages([{ id: nextIdRef.current++, role: "assistant", text: INITIAL_MESSAGE[language] }]);
    setDraft("");
    setPendingImage("");
    setChatError("");
    setPlayingMessageId(null);
  }

  function changeLanguage(nextLanguage: ChatLanguage) {
    setLanguage(nextLanguage);
    setMessages((current) => current.length === 1 && current[0].role === "assistant"
      ? [{ ...current[0], text: INITIAL_MESSAGE[nextLanguage] }]
      : current);
  }

  if (!sessionChecked) {
    return <main className="min-h-screen bg-[#f4f8f6]" aria-busy="true" />;
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f8f6] p-5">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900"><Stethoscope className="h-7 w-7" /></div>
          <h1 className="mt-5 text-2xl font-extrabold text-slate-950">{isHindi ? "Sehat Saathi" : "Sehat Saathi"}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{isHindi ? "AI sehat chat ka istemal karne ke liye apne patient ya health-worker account se sign in karein." : "Sign in with your patient or health-worker account to use the AI health chat."}</p>
          <p className="mt-3 text-xs leading-5 text-slate-500">{isHindi ? "Aapke messages aur chuni hui photos jawab banane ke liye OpenAI ko bheji jayengi, aapki manzoori ke baad." : "Your messages and selected photos are sent to OpenAI to generate replies, after you consent."}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-900 px-5 text-sm font-bold text-white hover:bg-emerald-800">{isHindi ? "मरीज़ / डॉक्टर साइन इन" : "Patient / doctor sign in"}</Link>
            <Link href="/worker-login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-200 px-5 text-sm font-bold text-emerald-900 hover:bg-emerald-50">{isHindi ? "स्वास्थ्यकर्मी साइन इन" : "Health-worker sign in"}</Link>
          </div>
          <Link href="/" className="mt-4 block text-sm font-semibold text-emerald-900 underline underline-offset-4">{isHindi ? "मुख्य पृष्ठ पर वापस जाएँ" : "Back to home"}</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f8f6] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href={session.role === "PATIENT" ? "/patient-portal" : "/workspace"} aria-label={isHindi ? "पोर्टल पर वापस जाएँ" : "Back to portal"} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-sm"><Stethoscope className="h-5 w-5" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">Sehat Saathi</h1>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${providerStatus === "ready" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                  {providerStatus === "ready"
                    ? "LIVE AI"
                    : providerStatus === "unconfigured"
                      ? (isHindi ? "सेटअप चाहिए" : "SETUP REQUIRED")
                      : providerStatus === "unavailable"
                        ? (isHindi ? "BACKEND बंद" : "BACKEND OFFLINE")
                        : (isHindi ? "जुड़ रहा है" : "CONNECTING")}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{isHindi ? "आपकी सेहत की बात, आपकी भाषा में" : "A caring health conversation, in your language"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => changeLanguage(isHindi ? "en" : "hi")} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" aria-label={isHindi ? "Switch to English" : "हिंदी में बदलें"}>
              <Languages className="h-4 w-4 text-emerald-800" />{isHindi ? "हिंदी" : "English"}
            </button>
            <button type="button" onClick={startNewConversation} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-900 px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-800">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">{isHindi ? "नई बातचीत" : "New chat"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-68px)] max-w-7xl gap-5 p-3 sm:p-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-7">
        <section className="flex min-h-[680px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_40px_-20px_rgba(15,76,55,0.22)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                <Sparkles className="h-5 w-5" /><span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{isHindi ? "आपका सेहत साथी" : "Your health companion"}</p>
                <p className={`text-[11px] font-medium ${providerStatus === "ready" ? "text-emerald-800" : "text-amber-700"}`}>
                  {providerStatus === "unconfigured"
                    ? (isHindi ? "AI सेवा configure नहीं है" : "AI service not configured")
                    : providerStatus === "unavailable"
                      ? (isHindi ? "Backend से जुड़ नहीं पा रहे" : "Cannot reach the backend")
                      : providerStatus === "ready"
                      ? (isHindi ? "AI से जुड़ा · लाइव जवाब" : "AI connected · live replies")
                      : (isHindi ? "AI सेवा जाँची जा रही है..." : "Checking AI service...")}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setVoiceReplies((enabled) => !enabled)} className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold ${voiceReplies ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`} aria-pressed={voiceReplies}>
              {voiceReplies ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="hidden sm:inline">{isHindi ? "जवाब बोलकर सुनाएँ" : "Speak replies"}</span>
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-amber-100 bg-amber-50/80 px-4 py-2.5 text-[11px] leading-4 text-amber-950 sm:px-6">
            <p>{isHindi ? "यह AI health assistant है, डॉक्टर नहीं। निदान या दवा के लिए डॉक्टर से बात करें।" : "This is an AI health assistant, not a doctor. Consult a clinician for diagnosis or treatment."}</p>
            <a href="tel:112" className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-red-700 px-2.5 py-1.5 font-bold text-white hover:bg-red-800"><PhoneCall className="h-3.5 w-3.5" />112</a>
          </div>

          {providerStatus === "unconfigured" && (
            <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs leading-5 text-amber-950 sm:px-6">
              {isHindi ? "AI शुरू करने के लिए backend/.env में OPENAI_API_KEY सेट करें और backend restart करें। Key browser में नहीं जाती।" : "Set OPENAI_API_KEY in backend/.env and restart the backend to enable AI replies. Your key stays server-side."}
            </div>
          )}
          {providerStatus === "unavailable" && (
            <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs leading-5 text-amber-950 sm:px-6">
              {isHindi ? "Backend उपलब्ध नहीं है। Backend शुरू करके पेज refresh करें।" : "The backend is unavailable. Start the backend and refresh this page."}
            </div>
          )}

          <div className="flex-1 space-y-5 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_#f3faf6,_#ffffff_55%)] px-4 py-5 sm:px-7">
            <div className="mx-auto max-w-2xl">
              <div className="mb-5 flex justify-center"><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold tracking-wide text-slate-500">{isHindi ? "निजी स्वास्थ्य बातचीत" : "PRIVATE HEALTH CONVERSATION"}</span></div>
              {messages.map((message) => (
                <div key={message.id} className={`mb-5 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] sm:max-w-[82%] ${message.role === "user" ? "order-2" : ""}`}>
                    {message.role === "assistant" && (
                      <div className="mb-1.5 flex items-center gap-2 pl-1">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><Stethoscope className="h-3.5 w-3.5" /></span>
                        <span className="text-[11px] font-bold text-slate-600">Sehat Saathi</span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${message.role === "user" ? "rounded-tr-md bg-emerald-900 text-white" : "rounded-tl-md border border-slate-100 bg-white text-slate-700"}`}>
                      {message.image && <Image src={message.image} alt={isHindi ? "आपकी जोड़ी हुई फोटो" : "Your attached photo"} width={480} height={320} unoptimized className="mb-3 max-h-56 w-auto max-w-full rounded-xl object-contain" />}
                      {message.streaming && !message.text
                        ? <span className="inline-flex items-center gap-2 text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />{isHindi ? "जवाब सोच रहा हूँ..." : "Thinking..."}</span>
                        : <p className="whitespace-pre-wrap">{message.text}</p>}
                    </div>
                    {message.role === "assistant" && message.text && (
                      <button type="button" onClick={() => void playMessageAudio(message)} disabled={voiceLoadingId === message.id || providerStatus !== "ready"} className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-emerald-900 disabled:opacity-60" aria-label={isHindi ? "AI की आवाज़ में जवाब सुनें" : "Listen to AI-generated reply"}>
                        {voiceLoadingId === message.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : playingMessageId === message.id ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                        {isHindi ? (voiceLoadingId === message.id ? "आवाज़ बन रही है..." : "AI आवाज़ सुनें") : (voiceLoadingId === message.id ? "Generating voice..." : "Listen to AI voice")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {messages.length === 1 && (
            <div className="border-t border-slate-100 px-4 pb-3 pt-3 sm:px-7">
              <p className="mx-auto mb-2 max-w-2xl text-[11px] font-semibold text-slate-500">{isHindi ? "शुरुआत के लिए पूछें" : "Try asking"}</p>
              <div className="mx-auto flex max-w-2xl flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => {
                  const prompt = isHindi ? suggestion.hi : suggestion.en;
                  return <button key={prompt} type="button" onClick={() => setDraft(prompt)} className="rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-medium text-emerald-900 transition-colors hover:border-emerald-300 hover:bg-emerald-50">{prompt}</button>;
                })}
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 bg-white p-3 sm:px-6 sm:py-4">
            <form onSubmit={sendMessage} className="mx-auto max-w-2xl">
              {pendingImage && (
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-2">
                  <Image src={pendingImage} alt={isHindi ? "भेजने के लिए चुनी गई फोटो" : "Selected photo to attach"} width={64} height={64} unoptimized className="h-14 w-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1"><p className="text-xs font-bold text-emerald-950">{isHindi ? "फोटो जोड़ी गई" : "Photo attached"}</p><p className="text-[11px] text-slate-600">{isHindi ? "भेजने पर OpenAI इसे देखेगा" : "OpenAI will receive it when you send"}</p></div>
                  <button type="button" onClick={() => setPendingImage("")} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white" aria-label={isHindi ? "फोटो हटाएँ" : "Remove photo"}><X className="h-4 w-4" /></button>
                </div>
              )}
              {chatError && <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-800">{chatError}</p>}
              {inputError && <p role="alert" className="mb-2 px-1 text-xs font-medium text-red-700">{inputError}</p>}
              <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelection} className="sr-only" aria-label={isHindi ? "फोटो चुनें" : "Choose a photo"} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-white hover:text-emerald-900" aria-label={isHindi ? "फोटो जोड़ें" : "Attach a photo"}><ImagePlus className="h-5 w-5" /></button>
                <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleComposerKeyDown} rows={1} maxLength={4000} placeholder={isHindi ? "अपनी तकलीफ यहाँ लिखें या बोलें..." : "Write or speak about what is troubling you..."} className="max-h-32 min-h-10 flex-1 resize-y bg-transparent px-1 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400" aria-label={isHindi ? "अपना संदेश लिखें" : "Write your message"} />
                <button type="button" onClick={startListening} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isListening ? "animate-pulse bg-red-100 text-red-700" : "text-slate-500 hover:bg-white hover:text-emerald-900"}`} aria-label={isListening ? (isHindi ? "सुनना रोकें" : "Stop listening") : (isHindi ? "बोलकर लिखें" : "Speak your message")} aria-pressed={isListening}>{isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button>
                <button type="submit" disabled={isStreaming || providerStatus !== "ready" || (!draft.trim() && !pendingImage)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900 text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300" aria-label={isHindi ? "संदेश भेजें" : "Send message"}>{isStreaming ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}</button>
              </div>
              <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">{isHindi ? "Enter से भेजें · Shift + Enter से नई लाइन · माइक पर बोलकर टेक्स्ट जाँचें" : "Enter to send · Shift + Enter for a new line · review speech text before sending"}</p>
            </form>
          </div>
        </section>

        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-900"><ShieldCheck className="h-5 w-5" /><h2 className="text-sm font-extrabold">{isHindi ? "आपकी निजता" : "Your privacy"}</h2></div>
            <p className="mt-3 text-xs leading-5 text-slate-600">{isHindi ? "आपकी अनुमति के बाद messages और चुनी हुई photos AI जवाब बनाने के लिए OpenAI को भेजे जाते हैं। ऐप conversation सेव नहीं करता; provider की data policy लागू होगी। पहचान बताने वाली जानकारी न भेजें।" : "After your consent, messages and selected photos are sent to OpenAI to generate replies. The app does not save conversations; the provider's data policy applies. Do not send identifying information."}</p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-900"><Check className="h-4 w-4 shrink-0" />{isHindi ? "पहले आपकी स्पष्ट अनुमति ली जाएगी" : "Your explicit consent is required first"}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900"><CircleHelp className="h-5 w-5 text-emerald-800" /><h2 className="text-sm font-extrabold">{isHindi ? "यह क्या कर सकता है?" : "What this can do"}</h2></div>
            <ul className="mt-3 space-y-2.5 text-xs leading-5 text-slate-600">
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{isHindi ? "हिंदी/अंग्रेज़ी में live AI chat" : "Live AI chat in Hindi and English"}</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{isHindi ? "फोटो के बारे में सवाल पूछें" : "Ask questions about an attached photo"}</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{isHindi ? "साफ़, AI-generated आवाज़ में जवाब सुनें" : "Listen to replies in clear, AI-generated voice"}</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{isHindi ? "माइक से बोलें; टेक्स्ट जाँचकर भेजें" : "Speak into the mic and review text before sending"}</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-2 text-red-900"><PhoneCall className="h-5 w-5" /><h2 className="text-sm font-extrabold">{isHindi ? "आपात स्थिति?" : "An emergency?"}</h2></div>
            <p className="mt-2 text-xs leading-5 text-red-900">{isHindi ? "सांस में गंभीर तकलीफ, बेहोशी, दौरा, तेज़ सीने का दर्द या बहुत खून बहने पर 112 पर कॉल करें या नज़दीकी emergency जाएँ।" : "For severe breathing trouble, unconsciousness, a seizure, severe chest pain, or heavy bleeding, call 112 in India or go to an emergency department."}</p>
            <a href="tel:112" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-700 px-3 text-xs font-bold text-white hover:bg-red-800"><PhoneCall className="h-4 w-4" />112</a>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[11px] leading-5 text-amber-950"><strong>{isHindi ? "ध्यान दें:" : "Please note:"}</strong> {isHindi ? "AI डॉक्टर नहीं है। जवाब सामान्य जानकारी हैं—निदान या दवा की सलाह नहीं। स्वास्थ्य संबंधी निर्णय के लिए योग्य डॉक्टर से बात करें।" : "AI is not a doctor. Replies are general information—not a diagnosis or prescription. Speak with a qualified clinician for healthcare decisions."}</div>
        </aside>
      </div>

      {showProviderConsent && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="provider-consent-title" className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><ShieldCheck className="h-5 w-5" /></span>
              <div>
                <h2 id="provider-consent-title" className="text-base font-extrabold text-slate-900">{isHindi ? "OpenAI को जानकारी भेजने की अनुमति" : "Consent to send information to OpenAI"}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{isHindi ? "आपका message और attach की हुई photo जवाब बनाने के लिए ArogyaSaathi backend से OpenAI को भेजी जाएगी। OpenAI की data policy लागू होगी। कृपया नाम, फोन, पता, या पहचान बताने वाली जानकारी न भेजें।" : "Your message and any attached photo will be sent through the ArogyaSaathi backend to OpenAI to generate a reply. OpenAI's data policy applies. Do not include names, phone numbers, addresses, or other identifying details."}</p>
                <p className="mt-2 text-xs leading-5 text-amber-800">{isHindi ? "यह AI डॉक्टर नहीं है। Photo/लक्षण के आधार पर diagnosis या दवा की सलाह नहीं दी जाएगी।" : "This AI is not a doctor and cannot provide a diagnosis or prescription from symptoms or photos."}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setShowProviderConsent(false); setConsentAction(null); }} className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">{isHindi ? "रद्द करें" : "Cancel"}</button>
              <button type="button" onClick={handleConsent} className="min-h-10 rounded-xl bg-emerald-900 px-4 text-sm font-bold text-white hover:bg-emerald-800">{isHindi ? "सहमत हूँ, जारी रखें" : "I agree, continue"}</button>
            </div>
          </section>
        </div>
      )}

      {showSpeechPrivacy && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="speech-privacy-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800"><Mic className="h-5 w-5" /></span>
              <div>
                <h2 id="speech-privacy-title" className="text-base font-extrabold text-slate-900">{isHindi ? "माइक इस्तेमाल करने से पहले" : "Before using your microphone"}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{isHindi ? "आपका browser/device अपना speech service इस्तेमाल कर सकता है, जो audio को इस पेज के बाहर process कर सकता है। सहमत न हों तो Cancel दबाएँ और type करें।" : "Your browser or device may use its own speech service, which could process audio outside this page. If you are not comfortable with that, cancel and type instead."}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{isHindi ? "ArogyaSaathi इस डेमो में audio रिकॉर्ड या अपलोड नहीं करता।" : "ArogyaSaathi does not record or upload audio."}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowSpeechPrivacy(false)} className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">{isHindi ? "रद्द करें" : "Cancel"}</button>
              <button type="button" onClick={() => { setShowSpeechPrivacy(false); beginListening(); }} className="min-h-10 rounded-xl bg-emerald-900 px-4 text-sm font-bold text-white hover:bg-emerald-800">{isHindi ? "समझ गया, जारी रखें" : "Continue"}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
