'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAIStore } from '@/store/aiStore';
import { useDataStore } from '@/store/dataStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { SuggestedPrompts } from './SuggestedPrompts';
import { ChartCanvas } from '@/components/charts/ChartCanvas';
import { SendHorizontal, Copy, User, Bot, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface AIChatPanelProps {
  compact?: boolean;
}

const SimpleMarkdown = ({ content }: { content: string }) => {
  return (
    <div className="space-y-3">
      {content.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (trimmed === '') return <div key={i} className="h-1" />;
        
        // Handle headers
        if (trimmed.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2">
            <div className="w-1 h-5 bg-[var(--accent-cyan)] rounded-full" />
            {trimmed.replace('### ', '')}
          </h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-bold text-white mt-6 mb-3 border-b border-white/10 pb-2">
            {trimmed.replace('## ', '')}
          </h2>;
        }
        if (trimmed.match(/^#+\s/)) {
           return <h4 key={i} className="font-bold text-white mt-3 mb-1 text-sm uppercase tracking-wider text-[var(--accent-violet)]">
             {trimmed.replace(/^#+\s/, '')}
           </h4>;
        }

        // Handle lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
           return (
             <div key={i} className="ml-1 flex gap-3 items-start group">
                <span className="text-[var(--accent-cyan)] mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_8px_var(--accent-cyan-glow)] flex-shrink-0" /> 
                <span className="flex-1" dangerouslySetInnerHTML={{ 
                  __html: trimmed.substring(2)
                    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
                    .replace(/`(.*?)`/g, '<code class="bg-black/40 px-1.5 py-0.5 rounded font-mono text-xs text-[var(--accent-amber)] border border-white/5">$1</code>')
                }} />
             </div>
           );
        }
        
        const htmlContent = trimmed
          .replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
          .replace(/`(.*?)`/g, '<code class="bg-black/40 px-1.5 py-0.5 rounded font-mono text-xs text-[var(--accent-amber)] border border-white/5">$1</code>');
        
        return <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
      })}
    </div>
  );
};

let lastProcessedQuery = '';

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ compact = false }) => {
  const { messages, isChatThinking, addMessage, setIsChatThinking } = useAIStore();
  const { getActiveSheetData } = useDataStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isChatThinking]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  useEffect(() => {
    const q = searchParams?.get('q');
    if (!q) {
      lastProcessedQuery = '';
      return;
    }
    if (q && q !== lastProcessedQuery && !isChatThinking && getActiveSheetData()) {
      lastProcessedQuery = q;
      // Strip query parameters from URL to avoid duplicate submit in Strict Mode/remount
      router.replace(window.location.pathname);
      handleSubmit(q);
    }
  }, [searchParams, isChatThinking, getActiveSheetData, router]);

  // Focus input on mount and view switch
  useEffect(() => {
    if (textareaRef.current && !isChatThinking) {
      textareaRef.current.focus();
    }
  }, [compact, isChatThinking]);

  const handleSubmit = async (queryToSubmit: string = input) => {
    const text = queryToSubmit.trim();
    if (!text || isChatThinking) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }

    const sheet = getActiveSheetData();
    if (!sheet) {
      toast.error('No dataset loaded.');
      return;
    }

    // Add user message
    addMessage({
      role: 'user',
      content: text
    });

    setIsChatThinking(true);

    const handleQueryError = (errMsg: string, errCode: string) => {
      console.error('Query Error:', { errMsg, errCode });
      
      let errorMessage = "Failed to connect to AI service.";
      let content = "I couldn't process that question. Please try again.";

      if (errCode === 'timeout' || errMsg.toLowerCase().includes('timed out') || errMsg.toLowerCase().includes('timeout')) {
        errorMessage = "Request timed out.";
        content = "That dataset query took a bit too long to process. The data might be too large or complex for a single query.";
      } else if (errCode === 'rate_limit' || errMsg.toLowerCase().includes('rate limit') || errMsg.includes('429')) {
        errorMessage = "Rate limit exceeded.";
        content = "I'm receiving too many requests right now. Please wait a moment and try again.";
      } else if (errMsg && errMsg !== '[object Object]') {
        errorMessage = errMsg;
      }

      addMessage({
        role: 'assistant',
        content,
        error: errorMessage
      });
    };

    try {
      // Get last 10 messages for history to avoid token limits
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/openrouter/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheet,
          question: text,
          history
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMsg = errorText || 'Failed to get answer';
        let errorCode = 'unknown';
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error) errorMsg = parsed.error;
          if (parsed.code) errorCode = parsed.code;
        } catch (e) {
          // not JSON
        }
        handleQueryError(errorMsg, errorCode);
        return;
      }

      // Read the streaming response
      const reader = res.body?.getReader();
      if (!reader) {
        handleQueryError('Response body is not readable', 'unknown');
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      // Parse the accumulated JSON response
      let parsedData: { answer?: string; chartConfig?: unknown } = { answer: accumulated };
      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // If JSON parse fails, use raw text as answer
          parsedData = { answer: accumulated };
        }
      }

      // Check if the response is an error payload from the stream
      if ((parsedData as { error?: string }).error) {
        const errPayload = parsedData as { error: string; code?: string };
        handleQueryError(errPayload.error, errPayload.code ?? 'unknown');
        return;
      }

      // Validate chartConfig — only store if it has the required fields
      const rawChart = parsedData.chartConfig as Record<string, unknown> | null | undefined;
      const validChart =
        rawChart &&
        typeof rawChart.type === 'string' &&
        rawChart.type.length > 0 &&
        typeof rawChart.xKey === 'string' &&
        rawChart.xKey.length > 0 &&
        typeof rawChart.yKey === 'string' &&
        rawChart.yKey.length > 0
          ? {
              id: `ai-chart-${Date.now()}`,
              type: rawChart.type as any,
              title: (rawChart.title as string) || 'AI Chart',
              xColumn: rawChart.xKey as string,
              yColumn: rawChart.yKey as string,
              groupBy: null,
              colorBy: null,
              aggregation: 'mean' as const,
              filters: {},
              options: {}
            }
          : undefined;

      // Add assistant message
      addMessage({
        role: 'assistant',
        content: parsedData.answer || 'I processed your data.',
        ...(validChart ? { chartConfig: validChart } : {})
      });

    } catch (error: any) {
      const errCode = error?.code || 'unknown';
      const errMsg = error?.message || String(error);
      handleQueryError(errMsg, errCode);
    } finally {
      setIsChatThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className={cn("flex flex-col h-full bg-transparent", compact ? "p-0" : "p-0")}>
      {/* Messages Area */}
      <div className={cn(
        "flex-1 overflow-y-auto w-full max-w-4xl mx-auto flex flex-col custom-scrollbar transition-all",
        compact ? "p-4 space-y-4" : "p-6 space-y-6"
      )}>
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[var(--accent-violet)] blur-3xl opacity-20 rounded-full" />
              <Bot className={cn("text-[var(--accent-violet)] relative z-10", compact ? "w-12 h-12" : "w-16 h-16")} />
            </div>
            <h3 className={cn("font-display font-bold text-white mb-3 text-center tracking-tight", compact ? "text-xl" : "text-3xl")}>
              Analyze with Axiom AI
            </h3>
            <p className={cn("text-[var(--text-secondary)] text-center max-w-md mx-auto mb-10 leading-relaxed", compact ? "text-xs mb-6 px-4" : "text-base px-6")}>
              Ask questions, generate charts, or find hidden patterns in your data. I'm powered by OpenRouter and trained for data science.
            </p>
            <div className={cn("w-full max-w-lg transition-all", compact && "max-w-xs")}>
               <SuggestedPrompts onSelect={(p) => handleSubmit(p)} />
            </div>
          </div>
        ) : (
          <div className={cn("pb-4", compact ? "space-y-4" : "space-y-6")}>
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}
                >
                  <div className={cn(
                    "flex gap-3 max-w-[92%]",
                    m.role === 'user' ? "flex-row-reverse" : "flex-row",
                    compact && "gap-2 max-w-[98%]"
                  )}>
                    {/* Avatar */}
                    <div className={cn(
                      "flex-shrink-0 flex items-center justify-center rounded-xl mt-1 shadow-lg",
                      compact ? "w-7 h-7" : "w-9 h-9",
                      m.role === 'user' 
                        ? "bg-[var(--accent-violet)] text-white" 
                        : "bg-white/10 text-white border border-white/20 backdrop-blur-md"
                    )}>
                      {m.role === 'user' ? <User className={compact ? "w-3.5 h-3.5" : "w-5 h-5"} /> : <Bot className={compact ? "w-3.5 h-3.5" : "w-5 h-5"} />}
                    </div>

                    {/* Message Bubble */}
                    <div className={cn("flex flex-col gap-2 min-w-0 flex-1", m.role === 'user' ? "items-end" : "items-start")}>
                      <GlassCard 
                        variant={m.role === 'user' ? 'default' : 'subtle'}
                        className={cn(
                          "relative group overflow-hidden transition-all duration-200",
                          m.role === 'user' 
                            ? "border-[var(--accent-violet)]/40 bg-[var(--accent-violet)]/15 rounded-tr-none" 
                            : "border-white/10 bg-white/5 rounded-tl-none shadow-xl",
                          compact ? "px-3.5 py-2.5" : "px-5 py-4"
                        )}
                      >
                        {m.role === 'assistant' && (
                          <button
                            onClick={() => handleCopy(m.content)}
                            className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 transition-all border border-white/10 backdrop-blur-sm"
                            title="Copy message"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                        
                        {m.error ? (
                          <div className="flex items-center gap-2 text-[var(--accent-red)]">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">{m.content}</span>
                          </div>
                        ) : (
                          <div className={cn(
                            "break-words leading-relaxed text-left w-full",
                            m.role === 'user' ? "text-white font-medium" : "text-[var(--text-primary)]",
                            compact ? "text-sm" : "text-[15px]"
                          )}>
                            {m.role === 'user' ? (
                               <p>{m.content}</p>
                            ) : (
                               <SimpleMarkdown content={m.content} />
                            )}
                          </div>
                        )}
                      </GlassCard>

                      {/* Associated Chart — only render when config has valid columns */}
                      {m.chartConfig &&
                        !m.error &&
                        m.chartConfig.xColumn &&
                        m.chartConfig.xColumn.length > 0 &&
                        m.chartConfig.yColumn &&
                        m.chartConfig.yColumn.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-2 text-left w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black/20"
                          >
                            <ChartCanvas config={m.chartConfig} height={compact ? 220 : 280} />
                          </motion.div>
                        )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isChatThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex w-full justify-start"
                >
                  <div className="flex gap-3 flex-row items-start max-w-[85%] mb-4">
                    <div className={cn(
                      "flex-shrink-0 flex items-center justify-center rounded-xl mt-1 bg-white/10 text-white border border-white/20 backdrop-blur-md",
                      compact ? "w-7 h-7" : "w-9 h-9"
                    )}>
                      <Bot className={compact ? "w-3.5 h-3.5" : "w-5 h-5"} />
                    </div>
                    <GlassCard 
                      variant="subtle"
                      className="px-5 py-3 border-white/10 bg-white/5 rounded-tl-none flex items-center justify-center h-11 w-20 shadow-xl"
                    >
                       <div className="flex items-center justify-center gap-2 h-full">
                          <div className="w-2 h-2 rounded-full bg-[var(--accent-violet)] animate-bounce [animation-duration:0.8s]" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-bounce [animation-duration:0.8s]" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-[var(--accent-violet)] animate-bounce [animation-duration:0.8s]" style={{ animationDelay: '300ms' }} />
                       </div>
                    </GlassCard>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <div ref={messagesEndRef} className="h-px w-full" />
      </div>

      {/* Input Area */}
      <div className={cn(
        "w-full max-w-4xl mx-auto flex-shrink-0 transition-all",
        compact ? "px-4 pb-4" : "px-6 pb-8"
      )}>
        <GlassCard 
          glow={input.trim() ? 'violet' : 'none'}
          className={cn(
            "flex items-end gap-3 transition-all duration-300 border-white/10 shadow-2xl relative z-10",
            input.trim() ? "border-[var(--accent-violet)]/40 bg-black/50" : "bg-black/40",
            compact ? "p-2 rounded-2xl" : "p-3 rounded-3xl"
          )}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder="Ask anything about your dataset..."
            className={cn(
              "flex-1 bg-transparent border-none outline-none resize-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)] custom-scrollbar min-h-[44px] max-h-[160px] transition-all",
              compact ? "text-sm py-2.5 px-3" : "text-[15px] py-3 px-4"
            )}
            style={{ 
              lineHeight: '1.6'
            }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isChatThinking}
            className={cn(
              "flex items-center justify-center rounded-xl bg-[var(--accent-violet)] text-white hover:bg-[#7b74ff] hover:scale-105 active:scale-95 transition-all flex-shrink-0 mb-1 mr-1 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-violet-500/20",
              compact ? "w-10 h-10" : "w-12 h-12"
            )}
          >
            <SendHorizontal className={compact ? "w-4.5 h-4.5" : "w-6 h-6"} />
          </button>
        </GlassCard>
        
        <div className="flex items-center justify-center gap-4 mt-4 opacity-50">
          {!compact && (
             <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.2em] font-medium">
               Axiom AI • OpenRouter Free • Experimental
             </span>
          )}
        </div>
      </div>
    </div>
  );
};
