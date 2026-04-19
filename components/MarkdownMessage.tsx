"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

type MarkdownMessageProps = {
  content: string;
};

/**
 * Upgrade "plain" markdown produced by some LLMs to proper GFM:
 * - Convert tab-delimited pseudo-tables (no pipes) into real markdown tables.
 * - Collapse runs of 3+ blank lines to a single blank line so gaps don't
 *   look broken.
 * - Trim trailing whitespace on each line.
 */
function preprocessMarkdown(raw: string): string {
  if (!raw) return raw;
  // Normalize line endings and trim trailing spaces.
  let text = raw.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "");

  // Convert tab-separated table blocks (2+ consecutive lines w/ tab cols) to
  // markdown tables. A line qualifies if it contains at least one real TAB
  // and no pipe character.
  const lines = text.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const tabRow = (s: string) => s.includes("\t") && !s.includes("|");
    if (tabRow(lines[i])) {
      // Collect a run of tab-rows (allow blank lines only if next is tab-row).
      const block: string[] = [lines[i]];
      let j = i + 1;
      while (j < lines.length && tabRow(lines[j])) {
        block.push(lines[j]);
        j++;
      }
      if (block.length >= 2) {
        const header = block[0].split("\t").map((c) => c.trim());
        const colCount = header.length;
        const pipeRow = (cells: string[]) =>
          "| " +
          cells
            .map((c) => c.trim().replace(/\|/g, "\\|"))
            .concat(Array(Math.max(0, colCount - cells.length)).fill(""))
            .slice(0, colCount)
            .join(" | ") +
          " |";
        out.push(pipeRow(header));
        out.push("| " + Array(colCount).fill("---").join(" | ") + " |");
        for (let k = 1; k < block.length; k++) {
          out.push(pipeRow(block[k].split("\t")));
        }
        i = j;
        continue;
      }
    }
    out.push(lines[i]);
    i++;
  }
  text = out.join("\n");

  // Collapse 3+ consecutive blank lines into a single blank line.
  text = text.replace(/\n{3,}/g, "\n\n");

  return text;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const processed = useMemo(() => preprocessMarkdown(content), [content]);
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}
