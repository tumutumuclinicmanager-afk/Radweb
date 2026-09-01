import React, { useState, useRef } from 'react';
import { Bold, Italic, Code, Eye, EyeOff, Sparkles } from 'lucide-react';
import { FormattedText } from './FormattedText';

interface FormattedTextareaProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  helpText?: string;
  id?: string;
  required?: boolean;
}

export const FormattedTextarea: React.FC<FormattedTextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  helpText,
  id,
  required,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (prefix: string, suffix: string = prefix, defaultPlaceholder: string = 'key finding') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let replacement = '';
    let newCursorPos = 0;

    if (selectedText.length > 0) {
      // If already wrapped in prefix/suffix, toggle off
      if (
        selectedText.startsWith(prefix) &&
        selectedText.endsWith(suffix) &&
        selectedText.length >= prefix.length + suffix.length
      ) {
        replacement = selectedText.substring(prefix.length, selectedText.length - suffix.length);
        newCursorPos = start + replacement.length;
      } else {
        replacement = `${prefix}${selectedText}${suffix}`;
        newCursorPos = start + replacement.length;
      }
    } else {
      replacement = `${prefix}${defaultPlaceholder}${suffix}`;
      newCursorPos = start + prefix.length + defaultPlaceholder.length;
    }

    const updated = value.substring(0, start) + replacement + value.substring(end);
    onChange(updated);

    // Restore focus and cursor position after React update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        if (selectedText.length > 0) {
          textareaRef.current.setSelectionRange(start, start + replacement.length);
        } else {
          textareaRef.current.setSelectionRange(start + prefix.length, start + prefix.length + defaultPlaceholder.length);
        }
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+B or Cmd+B for Bold
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      applyFormatting('**', '**', 'bold text');
    }
    // Ctrl+I or Cmd+I for Italic
    if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      applyFormatting('*', '*', 'italic text');
    }
  };

  const lines = value.split('\n').filter(Boolean);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => applyFormatting('**', '**', 'bold term')}
            title="Make selected text bold (**text** or Ctrl+B)"
            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold transition-colors flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Bold className="w-3 h-3" />
            <span>Bold</span>
          </button>
          
          <button
            type="button"
            onClick={() => applyFormatting('*', '*', 'italic text')}
            title="Make selected text italic (*text* or Ctrl+I)"
            className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors flex items-center border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Italic className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => applyFormatting('`', '`', 'code')}
            title="Wrap in monospace (`code`)"
            className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors flex items-center border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Code className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            title="Toggle Live Formatting Preview"
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 border cursor-pointer ${
              showPreview
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{showPreview ? 'Edit' : 'Preview'}</span>
          </button>
        </div>
      </div>

      {!showPreview ? (
        <textarea
          ref={textareaRef}
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-sans transition-all"
        />
      ) : (
        <div className="w-full min-h-[5rem] p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-sm text-slate-800 dark:text-slate-200">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-indigo-100 dark:border-indigo-900/40 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Rendered Preview
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
              {lines.length} {lines.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          {lines.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Type content to see preview...</p>
          ) : (
            <ul className="space-y-1.5">
              {lines.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <FormattedText text={line} boldClassName="font-bold text-blue-950 dark:text-blue-100 bg-blue-50/80 dark:bg-blue-900/30 px-1 py-0.5 rounded" />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>{helpText || 'Highlight text and press Ctrl+B or click Bold to emphasize key clinical findings.'}</span>
        <span className="font-mono text-[10px] text-slate-400">**bold**</span>
      </div>
    </div>
  );
};
