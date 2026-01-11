import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { acceptCompletion, autocompletion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { Prec } from '@codemirror/state';
import { keymap, EditorView } from '@codemirror/view';
import type { DataModelItem } from '@/types/data-catalog-response';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRunQuery: () => void;
  theme: 'dark' | 'light';
  models: DataModelItem[];
  placeholder?: string;
  className?: string;
}

const SqlEditor: React.FC<SqlEditorProps> = ({
  value,
  onChange,
  onRunQuery,
  theme,
  models,
  placeholder,
  className
}) => {
  const completionTheme = React.useMemo(() => EditorView.theme({
    ".cm-tooltip.cm-tooltip-autocomplete": {
      border: "1px solid var(--border)",
      backgroundColor: "var(--popover)",
      borderRadius: "6px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
      overflow: "hidden",
      "& > ul": {
        fontFamily: "inherit",
        "& > li": {
          padding: "6px 10px",
          fontSize: "0.85rem",
        },
        "& > li:hover": {
          backgroundColor: theme === 'dark' ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
        },
        "& > li[aria-selected]": {
          backgroundColor: theme === 'dark' ? "#264f78" : "#deecf9",
          color: theme === 'dark' ? "white" : "black",
        },
        "& > li[aria-selected]:hover": {
          backgroundColor: theme === 'dark' ? "#316191" : "#cbe4f6",
        }
      }
    },
    ".cm-completionLabel": {
      fontWeight: "400",
    },
    ".cm-completionMatchedText": {
      textDecoration: "none",
      fontWeight: "bold",
      color: theme === 'dark' ? "#4fc1ff" : "#0066cc",
    },
    ".cm-completionDetail": {
      fontSize: "0.75rem",
      opacity: "0.6",
      fontStyle: "italic",
      marginLeft: "0.5rem",
    }
  }), [theme]);

  const sqlAutocomplete = React.useCallback((context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    const effectiveModels = models.filter(m => m.is_queryable);
    return {
      from: word.from,
      options: effectiveModels.map(m => (
        { label: m.name, type: "variable", detail: `(model type: ${m.model_type})` }
      )),
    };
  }, [models]);

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={theme}
      placeholder={placeholder}
      extensions={[
        sql(),
        autocompletion({ override: [sqlAutocomplete] }),
        completionTheme,
        Prec.highest(keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              onRunQuery();
              return true;
            },
          },
          {
            key: "Tab",
            run: acceptCompletion,
          },
        ])),
      ]}
      onChange={onChange}
      className={className}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
      }}
    />
  );
};

export default SqlEditor;
