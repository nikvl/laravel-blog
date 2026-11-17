import { mergeAttributes } from '@tiptap/core';
import CodeBlock, { type CodeBlockOptions } from '@tiptap/extension-code-block';
import Image from '@tiptap/extension-image';
import { closeHistory } from '@tiptap/pm/history';
import { defaultMarkdownSerializer, type MarkdownSerializerState } from '@tiptap/pm/markdown';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { useMemo } from 'react';
import { isImageUrl, previewDocument } from './blogMedia';

type PreviewOptions = CodeBlockOptions & {
    onEditPreview: ((position: number, source: string) => void) | null;
};

function CodeBlockView({ node, extension, getPos, selected, deleteNode, editor }: NodeViewProps) {
    const isPreview = node.attrs.language === 'html-preview';
    const source = useMemo(() => isPreview ? previewDocument(node.textContent) : '', [isPreview, node.textContent]);

    if (!isPreview) {
        return <NodeViewWrapper as="pre"><NodeViewContent as="code" /></NodeViewWrapper>;
    }

    return (
        <NodeViewWrapper
            data-html-preview=""
            style={{ margin: '16px 0', border: `1px solid ${selected ? '#38bdf8' : '#334155'}`, borderRadius: 8, overflow: 'hidden' }}
        >
            <div contentEditable={false} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#162032' }}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>SVG / HTML</span>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        type="button"
                        onClick={() => {
                            const position = getPos();
                            if (typeof position === 'number') extension.options.onEditPreview?.(position, node.textContent);
                        }}
                        style={{ color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
                    >
                        Изменить код
                    </button>
                    <button type="button" onClick={() => { editor.view.dispatch(closeHistory(editor.state.tr)); deleteNode(); }} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                        Удалить блок
                    </button>
                </div>
            </div>
            <div contentEditable={false}>
                <iframe title="HTML / SVG" srcDoc={source} sandbox="" referrerPolicy="no-referrer" style={{ display: 'block', width: '100%', height: 480, border: 0, background: '#fff' }} />
            </div>
            <NodeViewContent as="code" style={{ display: 'none' }} />
        </NodeViewWrapper>
    );
}

export const PreviewCodeBlock = CodeBlock.extend<PreviewOptions>({
    addOptions() {
        return { ...CodeBlock.options, onEditPreview: null };
    },
    addStorage() {
        return {
            markdown: {
                serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
                    const runs = node.textContent.match(/`+/g) ?? [];
                    const fence = '`'.repeat(runs.reduce((length, run) => Math.max(length, run.length + 1), 3));
                    state.write(fence + (node.attrs.language || '') + '\n');
                    state.text(node.textContent, false);
                    state.write('\n' + fence);
                    state.closeBlock(node);
                },
            },
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(CodeBlockView);
    },
});

export const BlogImage = Image.extend({
    addStorage() {
        return {
            markdown: {
                serialize(state: MarkdownSerializerState, node: ProseMirrorNode, parent: ProseMirrorNode, index: number) {
                    defaultMarkdownSerializer.nodes.image(state, node, parent, index);
                    state.closeBlock(node);
                },
            },
        };
    },
    parseHTML() {
        return [{
            tag: 'img[src]',
            getAttrs: element => isImageUrl((element as HTMLElement).getAttribute('src') ?? '') ? null : false,
        }];
    },
    renderHTML({ HTMLAttributes }) {
        const attributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
        if (!isImageUrl(attributes.src ?? '')) delete attributes.src;
        return ['img', attributes];
    },
}).configure({ HTMLAttributes: { style: 'max-width:100%;height:auto;border-radius:8px;' } });
