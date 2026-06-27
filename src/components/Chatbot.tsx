import React from "react";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Compass, 
  User, 
  CornerDownLeft, 
  Award,
  AlertCircle
} from "lucide-react";
import { ChatMessage } from "../types";

interface ChatbotProps {
  onSendMessage: (message: string, history?: ChatMessage[]) => Promise<{ reply: string; timestamp: string }>;
  theme?: "light" | "dark";
}

export default function Chatbot({ onSendMessage, theme = "light" }: ChatbotProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: "model",
      text: "Hello! I am **CivicSense AI Bot**, your hyperlocal municipal service assistant. 🌲🤖 Please let me know your preferred language (English, Hindi, or Hinglish) so I can assist you in your choice!\n\nI can help you check the status of active complaints (like the Main Street pothole or Forest Park dumping), explain how our gamification leaderboard works, or guide you on how to file effective photographic logs. What can I assist you with today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Quick prompt suggestions
  const suggestions = [
    "Are there any water leaks near me?",
    "How does the gamified points system work?",
    "Check status of the pothole on Main Street",
    "How does AI detect fake/spam complaints?"
  ];

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    
    setErrorMsg("");
    const userMsg: ChatMessage = {
      role: "user",
      text: text,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputMessage("");
    setLoading(true);

    try {
      const response = await onSendMessage(text, updatedHistory);
      
      const botMsg: ChatMessage = {
        role: "model",
        text: response.reply,
        timestamp: response.timestamp || new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to connect to CivicSense server. Please verify connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom on new messages
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputMessage);
    }
  };

  // Convert simple markdown-like syntax (**bold**, *italic*, list items) to clean HTML safe inline styles or React tags
  const renderMessageText = (text: string) => {
    const isThemeDark = theme === "dark";
    const textColorClass = isThemeDark ? "text-slate-100" : "text-slate-900";
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      // Process bold/italic/lists
      let formatted = line;
      
      // Bold **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      formatted = formatted.replace(boldRegex, "<strong>$1</strong>");

      // Bullet points
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const bulletContent = formatted.trim().substring(2);
        return (
          <li key={lineIdx} className={`ml-4 list-disc text-xs ${textColorClass} py-0.5`} dangerouslySetInnerHTML={{ __html: bulletContent }} />
        );
      }

      return (
        <p key={lineIdx} className={`text-xs ${textColorClass} leading-relaxed py-0.5`} dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <div id="chatbot-view" className="max-w-3xl mx-auto flex flex-col h-[600px] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      
      {/* Bot Chat Header */}
      <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500 p-2 rounded-xl text-white shadow shadow-emerald-500/25">
            <MessageSquare className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm tracking-tight text-white leading-none">CivicSense AI Helper</h3>
            <span className="text-[10px] font-mono text-emerald-400 tracking-wide uppercase mt-1 inline-block">Real-time localized database connected</span>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: "12s" }} />
          <span>Gemini-3.5-Flash</span>
        </div>
      </div>

      {/* Messages Pane */}
      <div id="chat-messages-container" className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, index) => {
          const isBot = msg.role === "model";
          return (
            <div 
              key={index} 
              className={`flex items-start gap-3 max-w-[85%] ${isBot ? "mr-auto text-left" : "ml-auto flex-row-reverse text-right"}`}
            >
              {/* Avatar */}
              <div className={`p-1.5 rounded-lg text-white shrink-0 shadow-sm ${isBot ? "bg-slate-900" : "bg-emerald-500"}`}>
                {isBot ? <Compass className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              {/* Speech bubble */}
              <div className="space-y-1">
                <div className={`p-3 rounded-2xl border ${
                  isBot 
                    ? `bg-white border-slate-100 ${theme === "dark" ? "text-slate-100" : "text-slate-900"} rounded-tl-sm shadow-sm` 
                    : "bg-emerald-500 border-emerald-600 text-white rounded-tr-sm shadow-sm text-left"
                }`}>
                  <div className="space-y-1">
                    {isBot ? renderMessageText(msg.text) : <p className="text-xs text-white leading-relaxed">{msg.text}</p>}
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 font-mono block px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading / Typing Ellipsis indicator */}
        {loading && (
          <div className="flex items-start gap-3 mr-auto text-left max-w-[80%]">
            <div className="p-1.5 rounded-lg bg-slate-900 text-white shrink-0">
              <Compass className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="p-3.5 bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full inline-block animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full inline-block animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full inline-block animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-center space-x-1.5 max-w-sm mx-auto">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Language Preferences Bar (Visible on first message) */}
      {messages.length === 1 && (
        <div className="px-4 py-2 bg-emerald-50/50 border-t border-b border-emerald-100/50 flex items-center space-x-2 overflow-x-auto whitespace-nowrap scrollbar-none scroll-smooth">
          <span className="text-[10px] text-emerald-700 font-mono flex items-center space-x-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="font-bold">Preferred Language:</span>
          </span>
          <button
            id="lang-english"
            onClick={() => handleSend("I prefer English.")}
            className="px-3 py-1 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[10px] font-bold cursor-pointer transition-all shrink-0 shadow-sm"
          >
            English 🇬🇧
          </button>
          <button
            id="lang-hindi"
            onClick={() => handleSend("मुझे हिन्दी पसंद है, हिन्दी में बात करें।")}
            className="px-3 py-1 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[10px] font-bold cursor-pointer transition-all shrink-0 shadow-sm"
          >
            Hindi / हिन्दी 🇮🇳
          </button>
          <button
            id="lang-hinglish"
            onClick={() => handleSend("Mujhe Hinglish pasand hai, Hinglish mein baat karein.")}
            className="px-3 py-1 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[10px] font-bold cursor-pointer transition-all shrink-0 shadow-sm"
          >
            Hinglish 🗣️
          </button>
        </div>
      )}

      {/* Suggestion Prompts Row (Moved right above the type text box) */}
      <div className="px-4 py-2 bg-slate-50 border-t border-b border-slate-100 flex items-center space-x-2 overflow-x-auto whitespace-nowrap scrollbar-none scroll-smooth">
        <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-500">Suggestions:</span>
        </span>
        {suggestions.map((s) => (
          <button
            key={s}
            id={`suggestion-${s.replace(/\s+/g, '-')}`}
            onClick={() => handleSend(s)}
            className="px-3 py-1 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-full text-[10px] text-slate-600 hover:text-slate-900 font-medium cursor-pointer transition-all shrink-0 shadow-sm"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input panel */}
      <div className="p-4 border-t border-slate-100 bg-white flex items-center space-x-3">
        <textarea
          id="chat-textarea"
          rows={1}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about active water leaks, broken streetlights, or rewards..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white leading-relaxed resize-none scrollbar-none"
        />
        <button
          id="chat-send-btn"
          onClick={() => handleSend(inputMessage)}
          disabled={!inputMessage.trim() || loading}
          className={`p-2.5 rounded-xl border text-white transition-all shrink-0 cursor-pointer ${
            !inputMessage.trim() || loading
              ? "bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-600 border-emerald-600 shadow shadow-emerald-500/10 active:scale-95"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom informational bar */}
      <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex justify-between items-center">
        <span className="flex items-center space-x-1">
          <Award className="w-3.5 h-3.5 text-emerald-500" />
          <span>Ask questions to earn system intelligence badges!</span>
        </span>
        <span className="flex items-center space-x-1 text-[9px]">
          <CornerDownLeft className="w-3 h-3 text-slate-400" />
          <span>Press Enter to send</span>
        </span>
      </div>

    </div>
  );
}
