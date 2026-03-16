import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

interface ToolbarBtnProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ToolbarBtn: React.FC<ToolbarBtnProps> = ({
  label,
  active,
  onClick,
  disabled,
}) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    disabled={disabled}
    className={`px-1.5 py-0.5 text-xs font-semibold rounded transition-colors select-none ${
      active ? 'ring-1 ring-[var(--color-accent)]' : ''
    }`}
    style={{
      backgroundColor: active ? 'var(--color-accent)' : 'var(--color-bg)',
      color: active ? '#ffffff' : 'var(--color-text)',
      opacity: disabled ? 0.4 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
    title={label}
  >
    {label}
  </button>
);

// ---------------------------------------------------------------------------
// Toolbar separator
// ---------------------------------------------------------------------------

const Sep: React.FC = () => (
  <div
    className="w-px h-5 mx-1"
    style={{ backgroundColor: 'var(--color-border)' }}
  />
);

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

interface ToolbarProps {
  editor: ReturnType<typeof useEditor>;
}

const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  const btn = (
    label: string,
    action: () => void,
    isActive?: boolean,
    disabled?: boolean,
  ) => (
    <ToolbarBtn
      key={label}
      label={label}
      active={isActive}
      onClick={action}
      disabled={disabled}
    />
  );

  const handleInsertLink = () => {
    const url = window.prompt('Enter URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {btn('U', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
      {btn('S', () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}

      <Sep />

      {btn('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
      {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}

      <Sep />

      {btn('\u2022 List', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
      {btn('1. List', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      {btn('\u201C\u201D', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}

      <Sep />

      {btn('Code', () => editor.chain().focus().toggleCode().run(), editor.isActive('code'))}
      {btn('</>', () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive('codeBlock'))}
      {btn('\u2015', () => editor.chain().focus().setHorizontalRule().run())}

      <Sep />

      {btn('Link', handleInsertLink, editor.isActive('link'))}
      {btn('Table', () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}

      <Sep />

      {btn('\u21A9', () => editor.chain().focus().undo().run(), false, !editor.can().undo())}
      {btn('\u21AA', () => editor.chain().focus().redo().run(), false, !editor.can().redo())}
    </div>
  );
};

// ---------------------------------------------------------------------------
// RichTextEditor
// ---------------------------------------------------------------------------

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  editable = true,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {editable && <Toolbar editor={editor} />}

      <div
        className="prose prose-sm max-w-none px-4 py-3 min-h-[8rem] focus-within:outline-none"
        style={{ color: 'var(--color-text)' }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;
