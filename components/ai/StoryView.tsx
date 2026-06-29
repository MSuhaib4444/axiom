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

type BlockType = 'h1' | 'h2' | 'h3' | 'hr' | 'ul' | 'ol' | 'p' | 'codeblock' | 'blockquote' | 'table';

interface MarkdownBlock {
  type: BlockType;
  items?: string[];
  content?: string;
  lang?: string;
  headers?: string[];
  rows?: string[][];
}

// ─── Inline Renderer ─────────────────────────────────────────────────────────
// Correctly handles **bold** before *italic* to avoid collision.
function parseInline(text: string, keyPrefix = ''): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  // Tokenize using a regex that captures bold, italic, inline code in order
  const INLINE_RE = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = INLINE_RE.exec(text)) !== null) {
    const [full, , boldContent, , italicContent, , codeContent] = match;

    // Text before match
    if (match.index > lastIndex) {
      result.push(
        <span key={`${keyPrefix}t${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>
      );
    }

    if (boldContent !== undefined) {
      result.push(
        <strong key={`${keyPrefix}b${match.index}`} className="font-bold text-white">
          {parseInline(boldContent, `${keyPrefix}b${match.index}-`)}
        </strong>
      );
    } else if (italicContent !== undefined) {
      result.push(
        <em key={`${keyPrefix}i${match.index}`} className="italic text-[var(--text-primary)]">
          {parseInline(italicContent, `${keyPrefix}i${match.index}-`)}
        </em>
      );
    } else if (codeContent !== undefined) {
      result.push(
        <code
          key={`${keyPrefix}c${match.index}`}
          className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300 align-middle"
        >
          {codeContent}
        </code>
      );
    }

    lastIndex = match.index + full.length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    result.push(<span key={`${keyPrefix}t${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return result;
}

// ─── Block Parser ─────────────────────────────────────────────────────────────
function parseBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split('\n');
  const result: MarkdownBlock[] = [];
  let currentListType: 'ul' | 'ol' | null = null;
  let currentListItems: string[] = [];
  let currentParaLines: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = '';
  let inBlockquote = false;
  let bqLines: string[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushPara = () => {
    if (currentParaLines.length > 0) {
      result.push({ type: 'p', content: currentParaLines.join(' ') });
      currentParaLines = [];
    }
  };
  const flushList = () => {
    if (currentListType && currentListItems.length > 0) {
      result.push({ type: currentListType, items: [...currentListItems] });
      currentListItems = [];
      currentListType = null;
    }
  };
  const flushBQ = () => {
    if (inBlockquote && bqLines.length > 0) {
      result.push({ type: 'blockquote', content: bqLines.join(' ') });
      bqLines = [];
      inBlockquote = false;
    }
  };
  const flushTable = () => {
    if (inTable) {
      result.push({ type: 'table', headers: [...tableHeaders], rows: [...tableRows] });
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };
  const flushAll = () => { flushPara(); flushList(); flushBQ(); flushTable(); };

  for (const rawLine of lines) {
    // Code block mode
    if (inCodeBlock) {
      if (rawLine.trim().startsWith('```')) {
        result.push({ type: 'codeblock', content: codeLines.join('\n'), lang: codeLang });
        codeLines = [];
        codeLang = '';
        inCodeBlock = false;
      } else {
        codeLines.push(rawLine);
      }
      continue;
    }

    const line = rawLine.trim();

    // Empty line → flush everything
    if (line === '') {
      flushAll();
      continue;
    }

    // Code fence start
    if (line.startsWith('```')) {
      flushAll();
      inCodeBlock = true;
      codeLang = line.slice(3).trim();
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushAll();
      result.push({ type: 'hr' });
      continue;
    }

    // Headings
    if (line.startsWith('# ')) { flushAll(); result.push({ type: 'h1', content: line.slice(2).trim() }); continue; }
    if (line.startsWith('## ')) { flushAll(); result.push({ type: 'h2', content: line.slice(3).trim() }); continue; }
    if (line.startsWith('### ')) { flushAll(); result.push({ type: 'h3', content: line.slice(4).trim() }); continue; }

    // Blockquote
    if (line.startsWith('> ')) {
      flushPara();
      flushList();
      inBlockquote = true;
      bqLines.push(line.slice(2));
      continue;
    } else if (inBlockquote) {
      flushBQ();
    }

    // Unordered list
    const bulletMatch = rawLine.match(/^(\s*)([-*+])\s+(.*)$/);
    if (bulletMatch) {
      flushPara();
      if (currentListType !== 'ul') { flushList(); currentListType = 'ul'; }
      currentListItems.push(bulletMatch[3]?.trim() ?? '');
      continue;
    }

    // Ordered list
    const numberedMatch = rawLine.match(/^(\s*)\d+\.\s+(.*)$/);
    if (numberedMatch) {
      flushPara();
      if (currentListType !== 'ol') { flushList(); currentListType = 'ol'; }
      currentListItems.push(numberedMatch[2]?.trim() ?? '');
      continue;
    }

    // Table detection
    if (line.startsWith('|')) {
      flushPara();
      flushList();
      flushBQ();
      
      if (!inTable) {
        inTable = true;
      }
      
      const isSeparator = /^\|?[\s-:]+\|.*$/.test(line) && !/[a-zA-Z0-9]/.test(line);
      if (isSeparator) {
        continue;
      }
      
      let rowLine = line;
      if (rowLine.startsWith('|')) rowLine = rowLine.slice(1);
      if (rowLine.endsWith('|')) rowLine = rowLine.slice(0, -1);
      
      const cells = rowLine.split('|').map(cell => cell.trim());
      
      if (tableHeaders.length === 0) {
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Normal paragraph line
    flushList();
    currentParaLines.push(line);
  }

  flushAll();

  // Unclosed code block
  if (inCodeBlock && codeLines.length > 0) {
    result.push({ type: 'codeblock', content: codeLines.join('\n'), lang: codeLang });
  }

  return result;
}

// ─── Section color scheme (cycles per h2) ────────────────────────────────────
const SECTION_ACCENTS = [
  { border: 'border-[var(--accent-violet)]', text: 'text-[var(--accent-violet)]', bg: 'bg-[var(--accent-violet)]/10' },
  { border: 'border-[var(--accent-cyan)]',   text: 'text-[var(--accent-cyan)]',   bg: 'bg-[var(--accent-cyan)]/10' },
  { border: 'border-amber-400',              text: 'text-amber-400',              bg: 'bg-amber-400/10' },
  { border: 'border-emerald-400',            text: 'text-emerald-400',            bg: 'bg-emerald-400/10' },
  { border: 'border-pink-400',               text: 'text-pink-400',               bg: 'bg-pink-400/10' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const StoryView: React.FC<StoryViewProps> = ({ markdown, isStreaming }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { exportPDF } = useExport();

  const blocks = useMemo<MarkdownBlock[]>(() => {
    if (!markdown) return [];
    return parseBlocks(markdown);
  }, [markdown]);

  const handleExportPDF = () => exportPDF(contentRef, 'axiom_data_story.pdf');

  const handleCopyMarkdown = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown)
      .then(() => toast.success('Markdown copied to clipboard'))
      .catch(() => toast.error('Failed to copy'));
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
    <span
      className="inline-block w-[2px] h-4 ml-0.5 bg-[var(--accent-cyan)] animate-pulse rounded-sm"
      style={{ verticalAlign: 'middle' }}
    />
  ) : null;

  // Track h2 count to cycle accent colors
  let h2Count = 0;

  return (
    <GlassCard padding="lg" className="w-full flex flex-col relative overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[var(--accent-cyan)]" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base text-white leading-tight">AI Data Story</h3>
            <p className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-widest">
              {isStreaming ? 'Generating…' : `${blocks.length} sections rendered`}
            </p>
          </div>
        </div>

        {blocks.length > 0 && !isStreaming && (
          <div className="flex items-center gap-2">
            <GlassButton variant="ghost" size="sm" onClick={handleCopyMarkdown} leftIcon={<Copy className="w-3.5 h-3.5" />}>
              Copy Markdown
            </GlassButton>
            <GlassButton variant="primary" size="sm" onClick={handleExportPDF} leftIcon={<Download className="w-3.5 h-3.5" />}>
              Export PDF
            </GlassButton>
          </div>
        )}
      </div>

      {/* Content */}
      <div ref={contentRef} className="text-left w-full select-text">
        {blocks.length === 0 && isStreaming && (
          <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-[var(--accent-cyan)]" />
            Thinking{cursor}
          </p>
        )}

        {blocks.map((block, idx) => {
          const isLast = idx === blocks.length - 1;

          switch (block.type) {

            // ── H1 ──────────────────────────────────────────────────────────
            case 'h1':
              return (
                <div key={idx} className="mb-8 mt-2">
                  <h1 className="font-display text-3xl font-extrabold bg-gradient-to-r from-[var(--accent-violet)] via-[#a78bfa] to-[var(--accent-cyan)] bg-clip-text text-transparent leading-tight">
                    {parseInline(block.content ?? '', `h1-${idx}`)}
                    {isLast && cursor}
                  </h1>
                  <div className="h-px mt-3 bg-gradient-to-r from-[var(--accent-violet)]/40 via-[var(--accent-cyan)]/20 to-transparent" />
                </div>
              );

            // ── H2 ──────────────────────────────────────────────────────────
            case 'h2': {
              const accent = SECTION_ACCENTS[h2Count % SECTION_ACCENTS.length]!;
              h2Count++;
              return (
                <div key={idx} className="mt-8 mb-4">
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${accent.bg} border ${accent.border} border-opacity-30`}>
                    <span className={`w-1 h-5 rounded-full flex-shrink-0 ${accent.border.replace('border-', 'bg-')}`} />
                    <h2 className={`font-display text-lg font-bold ${accent.text} leading-tight`}>
                      {parseInline(block.content ?? '', `h2-${idx}`)}
                      {isLast && cursor}
                    </h2>
                  </div>
                </div>
              );
            }

            // ── H3 ──────────────────────────────────────────────────────────
            case 'h3':
              return (
                <h3 key={idx} className="font-display text-base font-semibold text-white mt-5 mb-2.5 flex items-center gap-2">
                  <span className="w-1 h-3.5 bg-[var(--accent-cyan)]/50 rounded-full flex-shrink-0" />
                  {parseInline(block.content ?? '', `h3-${idx}`)}
                  {isLast && cursor}
                </h3>
              );

            // ── Paragraph ────────────────────────────────────────────────────
            case 'p':
              return (
                <p key={idx} className="text-[var(--text-secondary)] text-sm leading-[1.85] mb-4">
                  {parseInline(block.content ?? '', `p-${idx}`)}
                  {isLast && cursor}
                </p>
              );

            // ── Horizontal rule ──────────────────────────────────────────────
            case 'hr':
              return (
                <div key={idx} className="my-7 flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/8" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <div className="flex-1 h-px bg-white/8" />
                </div>
              );

            // ── Blockquote ───────────────────────────────────────────────────
            case 'blockquote':
              return (
                <blockquote key={idx} className="my-4 pl-4 border-l-2 border-[var(--accent-violet)] bg-[var(--accent-violet)]/5 rounded-r-xl py-3 pr-4">
                  <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed">
                    {parseInline(block.content ?? '', `bq-${idx}`)}
                    {isLast && cursor}
                  </p>
                </blockquote>
              );

            // ── Code block ───────────────────────────────────────────────────
            case 'codeblock':
              return (
                <div key={idx} className="my-4 rounded-xl overflow-hidden border border-white/10">
                  {block.lang && (
                    <div className="px-4 py-1.5 bg-white/5 border-b border-white/10 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                      <span className="ml-2 text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">{block.lang}</span>
                    </div>
                  )}
                  <pre className="p-4 overflow-x-auto bg-black/40">
                    <code className="font-mono text-xs text-[var(--text-secondary)] leading-relaxed">
                      {block.content}
                    </code>
                  </pre>
                  {isLast && cursor}
                </div>
              );

            // ── Unordered list ───────────────────────────────────────────────
            case 'ul':
              return (
                <ul key={idx} className="space-y-2 mb-5 pl-1">
                  {block.items?.map((item, itemIdx) => {
                    const isLastItem = isLast && itemIdx === (block.items?.length ?? 0) - 1;
                    return (
                      <li key={itemIdx} className="flex items-start gap-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                        <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[var(--accent-violet)]/70 flex-shrink-0" />
                        <span>
                          {parseInline(item, `ul-${idx}-${itemIdx}`)}
                          {isLastItem && cursor}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              );

            // ── Ordered list ─────────────────────────────────────────────────
            case 'ol':
              return (
                <ol key={idx} className="space-y-2 mb-5 pl-1">
                  {block.items?.map((item, itemIdx) => {
                    const isLastItem = isLast && itemIdx === (block.items?.length ?? 0) - 1;
                    return (
                      <li key={itemIdx} className="flex items-start gap-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                        <span className="flex-shrink-0 mt-[1px] w-5 h-5 rounded-full bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/25 text-[var(--accent-cyan)] flex items-center justify-center text-[10px] font-mono font-bold">
                          {itemIdx + 1}
                        </span>
                        <span>
                          {parseInline(item, `ol-${idx}-${itemIdx}`)}
                          {isLastItem && cursor}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              );

            // ── Table ────────────────────────────────────────────────────────
            case 'table':
              return (
                <div key={idx} className="my-6 overflow-x-auto rounded-xl border border-white/10 bg-black/20">
                  <table className="w-full text-sm text-left border-collapse">
                    {block.headers && block.headers.length > 0 && (
                      <thead className="bg-white/5 border-b border-white/10 text-[var(--text-primary)]">
                        <tr>
                          {block.headers.map((header, hIdx) => (
                            <th key={`th-${hIdx}`} className="px-4 py-3 font-semibold">
                              {parseInline(header, `th-${idx}-${hIdx}`)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {block.rows?.map((row, rIdx) => {
                        const isLastRow = isLast && rIdx === (block.rows?.length ?? 0) - 1;
                        return (
                          <tr key={`tr-${rIdx}`} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                            {row.map((cell, cIdx) => {
                              const isLastCell = isLastRow && cIdx === row.length - 1;
                              return (
                                <td key={`td-${cIdx}`} className="px-4 py-3 text-[var(--text-secondary)]">
                                  {parseInline(cell, `td-${idx}-${rIdx}-${cIdx}`)}
                                  {isLastCell && cursor}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </GlassCard>
  );
};
