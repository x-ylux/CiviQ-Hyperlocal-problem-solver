import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, Zap } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
}

export function CivicChat() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial_1",
      role: "bot",
      text: "👋 Hi! I'm your CiviQ assistant. I can help you report issues, understand RTI rights, search local recycling guidelines, or calculate carbon offsets!",
    },
  ]);
  const [typing, setTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typing]);

  const handleSend = async (textToSend?: string) => {
    const msgText = (textToSend || input).trim();
    if (!msgText) return;

    if (!textToSend) {
      setInput("");
    }

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: "user",
      text: msgText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgText,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (!res.ok) throw new Error("Chat call failed");
      const data = await res.json();

      const botMsg: ChatMessage = {
         id: Math.random().toString(36).substring(2, 9),
         role: "bot",
         text: data.text,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const fallbackMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: "bot",
        text: "I encountered an issue connecting to my brains on the server. Please check your network or try again!",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-3xl border border-emerald-900/10 shadow-2xl w-80 h-96 flex flex-col overflow-hidden mb-4 animate-fade-in">
          {/* Header */}
          <div className="bg-[#1D3B1F] text-white p-4 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-800 p-1.5 rounded-xl">
                <Bot className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-sans">CiviQ Assistant</h4>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[8px] text-emerald-300 font-medium">Always Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-emerald-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed font-sans ${
                  m.role === "bot"
                    ? "bg-emerald-50 text-emerald-950 rounded-tl-sm self-start mr-auto"
                    : "bg-emerald-800 text-emerald-50 rounded-tr-sm self-end ml-auto"
                }`}
              >
                {m.text}
              </div>
            ))}
            {typing && (
              <div className="bg-emerald-50 text-emerald-950 rounded-tl-sm p-3 rounded-2xl text-xs max-w-[40px] flex gap-1 justify-center items-center">
                <span className="w-1 h-1 bg-emerald-800 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 bg-emerald-800 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 bg-emerald-800 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chips */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1">
              <button
                onClick={() => handleSend("How do I report an issue?")}
                className="text-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full border border-emerald-100 font-bold transition-all cursor-pointer"
              >
                How to report?
              </button>
              <button
                onClick={() => handleSend("What are my RTI rights?")}
                className="text-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full border border-emerald-100 font-bold transition-all cursor-pointer"
              >
                What is RTI?
              </button>
              <button
                onClick={() => handleSend("Tell me about the 3-bin system")}
                className="text-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full border border-emerald-100 font-bold transition-all cursor-pointer"
              >
                3-bin system
              </button>
            </div>
          )}

          {/* Input field */}
          <div className="p-3 border-t border-emerald-900/5 flex gap-2 items-center flex-shrink-0">
            <input
              type="text"
              placeholder="Ask anything civic..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              className="flex-1 bg-emerald-50/40 border border-emerald-200/50 rounded-xl px-3 py-2 text-xs outline-none text-emerald-950 focus:border-emerald-600"
            />
            <button
              onClick={() => handleSend()}
              className="p-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-emerald-800 hover:bg-emerald-950 rounded-full flex items-center justify-center text-white shadow-2xl cursor-pointer transition-all hover:scale-105"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
    </div>
  );
}
