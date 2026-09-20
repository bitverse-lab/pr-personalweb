"use client";

import { useState } from "react";
import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  FiBold,
  FiCode,
  FiImage,
  FiItalic,
  FiLink,
  FiList,
  FiMinus,
  FiRotateCcw,
  FiRotateCw,
} from "react-icons/fi";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import UploadDropzone from "@/components/me/media/UploadDropzone";
import type { RichDoc } from "@/db/schema/content";

type DialogKind = "link" | "image" | null;

function UrlDialog({ kind, initial, onSubmit, onClose }: { kind: "link" | "image"; initial: string; onSubmit: (url: string) => void; onClose: () => void }) {
  const panelRef = useDialogA11y<HTMLDivElement>(onClose);
  const [url, setUrl] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const showUpload = kind === "image" && tab === "upload";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let value = url.trim();
    if (kind === "link" && value && !/^(https?:\/\/|mailto:)/i.test(value)) value = `https://${value}`;
    if (value && kind === "image" && !/^https?:\/\//i.test(value)) return setError("Image URLs must start with http:// or https://");
    onSubmit(value);
  };

  return (
    <div role="presentation" className="me-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} className="me-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="url-dialog-title" onClick={(e) => e.stopPropagation()}>
        <h6 id="url-dialog-title" className="mb-3">{kind === "link" ? "Insert link" : "Insert image"}</h6>
        {kind === "image" && (
          <div className="btn-group btn-group-sm w-100 mb-3" role="group" aria-label="Image source">
            <button type="button" className={`btn ${tab === "upload" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("upload")}>Upload</button>
            <button type="button" className={`btn ${tab === "url" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("url")}>From URL</button>
          </div>
        )}
        {showUpload ? (
          <>
            <UploadDropzone purpose="editor" accept="image" onUploaded={(m) => m.url && onSubmit(m.url)} />
            <div className="d-flex justify-content-end mt-3">
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose}>Cancel</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <label className="form-label small mb-1" htmlFor="url-input">{kind === "link" ? "URL (leave empty to remove the link)" : "Image URL"}</label>
            <input id="url-input" className="form-control mb-3" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" autoFocus />
            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">Apply</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ToolButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-secondary border-0"}`}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, openDialog }: { editor: Editor; openDialog: (k: Exclude<DialogKind, null>) => void }) {
  const chain = () => editor.chain().focus();
  return (
    <div className="rich-toolbar d-flex flex-wrap align-items-center gap-1 p-2 border-bottom" role="toolbar" aria-label="Formatting">
      <ToolButton label="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()}><strong>H2</strong></ToolButton>
      <ToolButton label="Subheading" active={editor.isActive("heading", { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()}><strong>H3</strong></ToolButton>
      <span className="vr mx-1" />
      <ToolButton label="Bold" active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()}><FiBold /></ToolButton>
      <ToolButton label="Italic" active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()}><FiItalic /></ToolButton>
      <ToolButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => chain().toggleStrike().run()}><s>S</s></ToolButton>
      <ToolButton label="Inline code" active={editor.isActive("code")} onClick={() => chain().toggleCode().run()}><FiCode /></ToolButton>
      <span className="vr mx-1" />
      <ToolButton label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => chain().toggleBulletList().run()}><FiList /></ToolButton>
      <ToolButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => chain().toggleOrderedList().run()}><span className="fw-semibold">1.</span></ToolButton>
      <ToolButton label="Quote" active={editor.isActive("blockquote")} onClick={() => chain().toggleBlockquote().run()}><span className="fw-bold">“</span></ToolButton>
      <ToolButton label="Code block" active={editor.isActive("codeBlock")} onClick={() => chain().toggleCodeBlock().run()}><span className="fw-semibold">{"{ }"}</span></ToolButton>
      <ToolButton label="Divider" onClick={() => chain().setHorizontalRule().run()}><FiMinus /></ToolButton>
      <span className="vr mx-1" />
      <ToolButton label="Link" active={editor.isActive("link")} onClick={() => openDialog("link")}><FiLink /></ToolButton>
      <ToolButton label="Image" onClick={() => openDialog("image")}><FiImage /></ToolButton>
      <span className="vr mx-1" />
      <ToolButton label="Undo" disabled={!editor.can().undo()} onClick={() => chain().undo().run()}><FiRotateCcw /></ToolButton>
      <ToolButton label="Redo" disabled={!editor.can().redo()} onClick={() => chain().redo().run()}><FiRotateCw /></ToolButton>
    </div>
  );
}

export default function RichEditor({
  initial,
  onChange,
  onReady,
  placeholder = "Start writing…",
  minHeight = 320,
}: {
  initial: RichDoc;
  onChange: (doc: RichDoc) => void;
  onReady?: (editor: Editor) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const [dialog, setDialog] = useState<DialogKind>(null);

  const editor = useEditor({
    immediatelyRender: false, // avoid SSR hydration mismatch
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" } }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content: initial as JSONContent,
    editorProps: { attributes: { class: "rich-content", role: "textbox", "aria-multiline": "true", "aria-label": "Editor" } },
    onCreate: ({ editor: e }) => onReady?.(e),
    onUpdate: ({ editor: e }) => onChange(e.getJSON() as RichDoc),
  });

  if (!editor) return <div className="border rounded bg-white" style={{ minHeight: minHeight + 50 }} />;

  const applyDialog = (url: string) => {
    if (dialog === "link") {
      if (!url) editor.chain().focus().extendMarkRange("link").unsetLink().run();
      else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    } else if (dialog === "image" && url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setDialog(null);
  };

  return (
    <div className="border rounded bg-white rich-editor">
      <Toolbar editor={editor} openDialog={setDialog} />
      <div role="presentation" className="p-3" style={{ minHeight }} onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
      {dialog && (
        <UrlDialog kind={dialog} initial={dialog === "link" ? (editor.getAttributes("link").href as string | undefined) ?? "" : ""} onSubmit={applyDialog} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}
