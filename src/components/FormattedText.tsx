import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
  boldClassName?: string;
  italicClassName?: string;
  codeClassName?: string;
}

/**
 * Removes markdown and HTML bold/italic/code tags to produce clean plain text.
 */
export function stripFormatting(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/<b>(.*?)<\/b>/gi, '$1')
    .replace(/<strong>(.*?)<\/strong>/gi, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1');
}

/**
 * Parses inline formatting (markdown bold `**text**`, `__text__`, HTML `<b>text</b>`, `<strong>text</strong>`,
 * italic `*text*`, `_text_`, and code `` `code` ``) into safe React elements.
 */
export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  className = '',
  boldClassName = 'font-bold text-slate-900 dark:text-white',
  italicClassName = 'italic text-slate-800 dark:text-slate-200',
  codeClassName = 'px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono text-[0.9em]',
}) => {
  if (!text) return null;

  // Regex tokenizing:
  // 1. **bold** or __bold__
  // 2. <b>bold</b> or <strong>bold</strong>
  // 3. *italic* or _italic_
  // 4. `code`
  const regex = /(\*\*[\s\S]*?\*\*|__[\s\S]*?__|<b>[\s\S]*?<\/b>|<strong>[\s\S]*?<\/strong>|\*[\s\S]*?\*|_[\s\S]*?_|`[\s\S]*?`)/g;
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        // Markdown bold **text** or __text__
        if (
          (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
          (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
        ) {
          const content = part.slice(2, -2);
          return (
            <strong key={index} className={boldClassName}>
              {content}
            </strong>
          );
        }

        // HTML bold <b>text</b>
        if (part.toLowerCase().startsWith('<b>') && part.toLowerCase().endsWith('</b>') && part.length >= 7) {
          const content = part.slice(3, -4);
          return (
            <strong key={index} className={boldClassName}>
              {content}
            </strong>
          );
        }

        // HTML strong <strong>text</strong>
        if (part.toLowerCase().startsWith('<strong>') && part.toLowerCase().endsWith('</strong>') && part.length >= 17) {
          const content = part.slice(8, -9);
          return (
            <strong key={index} className={boldClassName}>
              {content}
            </strong>
          );
        }

        // Code `code`
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
          const content = part.slice(1, -1);
          return (
            <code key={index} className={codeClassName}>
              {content}
            </code>
          );
        }

        // Italic *text* or _text_
        if (
          (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) ||
          (part.startsWith('_') && part.endsWith('_') && part.length >= 2 && !part.startsWith('__'))
        ) {
          const content = part.slice(1, -1);
          return (
            <em key={index} className={italicClassName}>
              {content}
            </em>
          );
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};
