'use client';

import React, { useRef, useMemo } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { Download, Copy, FileText, Sparkles } from 'lucide-react';
import { useExport } from '@/hooks/useExport';
import toast from 'react-hot-toast';

export interface StoryViewProps {
  markdown: string | null;
  isStreaming: boolean;
}

interface MarkdownBlock {
  type: 'h1' | 'h2' | 'h3' | 'hr' | 'ul' | 'ol' | 'p' | 'codeblock';
  items?: string[];
  content?: string;
  lang?: string;
}

export const StoryView: React.FC<StoryViewProps> = ({ markdown, isStreaming }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { exportPDF } = useExport();

  // Custom inline renderer for bold, italic, and inline code
  const parseInline = (text: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining) {
      const boldIndex = remaining.indexOf('**');
      const italicIndex = remaining.indexOf('*');
      const codeIndex = remaining.indexOf('`');

      const indices = [
        { type: 'bold', index: boldIndex, length: 2 },
        { type: 'italic', index: italicIndex, length: 1 },
        { type: 'code', index: codeIndex, length: 1 },
      ].filter((x) => x.index !== -1);

      if (indices.length === 0) {
        tokens.push(<span key={key++}>{remaining}</span>);
        break;
      }

      indices.sort((a, b) => a.index - b.index);
      const first = indices[0]!;

      if (first.index > 0) {
        tokens.push(<span key={key++}>{remaining.slice(0, first.index)}</span>);
      }

      remaining = remaining.slice(first.index + first.length);

      if (first.type === 'bold') {
        const endBoldIndex = remaining.indexOf('**');
        if (endBoldIndex === -1) {
          tokens.push(<span key={key++}>**</span>);
        } else {
          const boldText = remaining.slice(0, endBoldIndex);
          tokens.push(
            <strong key={key++} className="font-bold text-white">
              {parseInline(boldText)}
            </strong>
          );
          remaining = remaining.slice(endBoldIndex + 2);
        }
      } else if (first.type === 'italic') {
        const endItalicIndex = remaining.indexOf('*');
        if (endItalicIndex === -1) {
          tokens.push(<span key={key++}>*</span>);
        } else {
          const italicText = remaining.slice(0, endItalicIndex);
          tokens.push(
            <em key={key++} className="italic text-[var(--text-primary)]">
              {parseInline(italicText)}
            </em>
          );
          remaining = remaining.slice(endItalicIndex + 1);
        }
      } else if (first.type === 'code') {
        const endCodeIndex = remaining.indexOf('`');
        if (endCodeIndex === -1) {
          tokens.push(<span key={key++}>`</span>);
        } else {
          const codeText = remaining.slice(0, endCodeIndex);
          tokens.push(
            <code
              key={key++}
              className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300"
            >
              {codeText}
            </code>
          );
          remaining = remaining.slice(endCodeIndex + 1);
        }
      }
    }

    return tokens;
  };

  // Block-level markdown parser
  const blocks = useMemo<MarkdownBlock[]>(() => {
    if (!markdown) return [];

    const lines = markdown.split('\n');
    const result: MarkdownBlock[] = [];

    let currentListType: 'ul' | 'ol' | null = null;
    let currentListItems: string[] = [];
    let currentParagraphLines: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';

    const flushParagraph = () => {
      if (currentParagraphLines.length > 0) {
        result.push({
          type: 'p',
          content: currentParagraphLines.join(' '),
        });
        currentParagraphLines = [];
      }
    };

    const flushList = () => {
      if (currentListType && currentListItems.length > 0) {
        result.push({
          type: currentListType,
          items: currentListItems,
        });
        currentListItems = [];
        currentListType = null;
      }
    };

    const flushAll = () => {
      flushParagraph();
      flushList();
    };

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      if (rawLine === undefined) continue;

      if (inCodeBlock) {
        if (rawLine.trim().startsWith('```')) {
          inCodeBlock = false;
          result.push({
            type: 'codeblock',
            content: codeBlockContent.join('\n'),
            lang: codeBlockLang,
          });
          codeBlockContent = [];
          codeBlockLang = '';
        } else {
          codeBlockContent.push(rawLine);
        }
        continue;
      }

      const line = rawLine.trim();

      if (line === '') {
        flushAll();
        continue;
      }

      if (line.startsWith('```')) {
        flushAll();
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
        continue;
      }

      if (line === '---' || line === '***' || line === '___') {
        flushAll();
        result.push({ type: 'hr' });
        continue;
      }

      if (line.startsWith('# ')) {
        flushAll();
        result.push({ type: 'h1', content: line.slice(2).trim() });
        continue;
      }
      if (line.startsWith('## ')) {
        flushAll();
        result.push({ type: 'h2', content: line.slice(3).trim() });
        continue;
      }
      if (line.startsWith('### ')) {
        flushAll();
        result.push({ type: 'h3', content: line.slice(4).trim() });
        continue;
      }

      const bulletMatch = rawLine.match(/^(\s*)([-*+])\s+(.*)$/);
      if (bulletMatch) {
        flushParagraph();
        if (currentListType !== 'ul') {
          flushList();
          currentListType = 'ul';
        }
        currentListItems.push(bulletMatch[3]?.trim() ?? '');
        continue;
      }

      const numberedMatch = rawLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (numberedMatch) {
        flushParagraph();
        if (currentListType !== 'ol') {
          flushList();
          currentListType = 'ol';
        }
        currentListItems.push(numberedMatch[3]?.trim() ?? '');
        continue;
      }

      flushList();
      currentParagraphLines.push(line);
    }

    flushAll();

    if (inCodeBlock && codeBlockContent.length > 0) {
      result.push({
        type: 'codeblock',
        content: codeBlockContent.join('\n'),
        lang: codeBlockLang,
      });
    }

    return result;
  }, [markdown]);

  const handleExportPDF = () => {
    exportPDF(contentRef, 'axiom_data_story.pdf');
  };

  const handleCopyHTML = () => {
    if (!contentRef.current) {
      toast.error('Report content not found');
      return;
    }
    const htmlContent = contentRef.current.innerHTML;
    navigator.clipboard.writeText(htmlContent)
      .then(() => toast.success('HTML copied to clipboard'))
      .catch((err) => {
        console.error(err);
        toast.error('Failed to copy HTML');
      });
  };

  if (!markdown && !isStreaming) {
    return (
      <GlassCard className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <FileText className="w-12 h-12 text-[var(--text-tertiary)] mb-4" />
        <p className="text-[var(--text-secondary)] text-sm">No report generated yet.</p>
      </GlassCard>
    );
  }

  const cursor = isStreaming ? (
    <span className="inline-block w-1.5 h-4 ml-1 bg-[#00D4FF] animate-pulse rounded-sm" style={{ verticalAlign: 'middle' }} />
  ) : null;

  return (
    <GlassCard padding="lg" className="w-full flex flex-col relative overflow-hidden transition-all duration-300">
      {/* Header bar with controls */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h3 className="font-display font-semibold text-lg text-white">AI Data Story</h3>
        </div>
        
        {blocks.length > 0 && (
          <div className="flex items-center gap-2">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleCopyHTML}
              disabled={isStreaming}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
            >
              Copy as HTML
            </GlassButton>
            <GlassButton
              variant="primary"
              size="sm"
              onClick={handleExportPDF}
              disabled={isStreaming}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export PDF
            </GlassButton>
          </div>
        )}
      </div>

      {/* Rendered content area */}
      <div ref={contentRef} className="text-left w-full select-text max-w-none pr-2">
        {blocks.map((block, idx) => {
          const isLastBlock = idx === blocks.length - 1;

          switch (block.type) {
            case 'h1':
              return (
                <h1 key={idx} className="font-display text-3xl font-extrabold bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] bg-clip-text text-transparent mt-8 mb-4 leading-tight">
                  {parseInline(block.content || '')}
                  {isLastBlock && cursor}
                </h1>
              );

            case 'h2':
              return (
                <h2 key={idx} className="font-display text-xl font-bold mt-6 mb-3 pb-2 border-b border-white/10 text-white">
                  {parseInline(block.content || '')}
                  {isLastBlock && cursor}
                </h2>
              );

            case 'h3':
              return (
                <h3 key={idx} className="font-display text-lg font-semibold mt-4 mb-2 text-white">
                  {parseInline(block.content || '')}
                  {isLastBlock && cursor}
                </h3>
              );

            case 'p':
              return (
                <p key={idx} className="text-[var(--text-secondary)] mb-4 text-sm leading-relaxed whitespace-pre-line">
                  {parseInline(block.content || '')}
                  {isLastBlock && cursor}
                </p>
              );

            case 'hr':
              return <hr key={idx} className="my-6 border-t border-white/10" />;

            case 'codeblock':
              return (
                <div key={idx} className="relative">
                  <pre className="glass-card font-mono text-xs p-4 mb-4 overflow-x-auto text-[var(--text-secondary)] border border-white/10 bg-black/40">
                    <code>{block.content}</code>
                  </pre>
                  {isLastBlock && cursor}
                </div>
              );

            case 'ul':
              return (
                <ul key={idx} className="space-y-2 mb-4 list-none pl-1">
                  {block.items?.map((item, itemIdx) => {
                    const isLastItem = isLastBlock && itemIdx === block.items!.length - 1;
                    return (
                      <li key={itemIdx} className="flex items-start text-sm text-[var(--text-secondary)]">
                        <span className="inline-block text-[#6C63FF] mr-2.5 mt-1.5 flex-shrink-0 text-[10px]">◆</span>
                        <span className="w-full">
                          {parseInline(item)}
                          {isLastItem && cursor}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              );

            case 'ol':
              return (
                <ol key={idx} className="space-y-2 mb-4 list-none pl-1">
                  {block.items?.map((item, itemIdx) => {
                    const isLastItem = isLastBlock && itemIdx === block.items!.length - 1;
                    return (
                      <li key={itemIdx} className="flex items-start text-sm text-[var(--text-secondary)]">
                        <span className="inline-block text-[#6C63FF] font-bold font-mono mr-2.5 flex-shrink-0 text-xs">
                          {itemIdx + 1}.
                        </span>
                        <span className="w-full">
                          {parseInline(item)}
                          {isLastItem && cursor}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              );

            default:
              return null;
          }
        })}
        {blocks.length === 0 && isStreaming && (
          <p className="text-sm text-[var(--text-secondary)] flex items-center">
            Thinking
            {cursor}
          </p>
        )}
      </div>
    </GlassCard>
  );
};
