import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { acceptCompletion, autocompletion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';
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
