import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { autoSizePreview } from '../../resources/js/Pages/BlogPreviewFrame';
import { BlogImage, PreviewCodeBlock } from '../../resources/js/Pages/Admin/BlogMediaExtensions';
import { isImageUrl, previewCsp, previewDocument } from '../../resources/js/Pages/Admin/blogMedia';

const editors: Editor[] = [];
function createEditor(content: string) {
    const editor = new Editor({
        extensions: [StarterKit.configure({ codeBlock: false }), BlogImage, PreviewCodeBlock, Markdown],
        content,
    });
    editors.push(editor);
    return editor;
}
function markdown(editor: Editor): string {
    return (editor.storage as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown();
}
afterEach(() => { editors.splice(0).forEach(editor => editor.destroy()); });

describe('media Markdown round-trip', () => {
    it('preserves an image between paragraphs with its description', () => {
        const source = 'Before\n\n![Diagram](/storage/blog-images/diagram.png)\n\nAfter';
        const editor = createEditor(source);
        expect(markdown(editor)).toBe(source);
        expect(createEditor(markdown(editor)).getJSON()).toEqual(editor.getJSON());
    });

    it('preserves HTML, SVG, unicode, entities and backticks in a preview', () => {
        const source = '<style>p { color: red }</style>\n<p title="&quot;">Привет &amp; мир</p>\n<svg viewBox="0 0 100 100"><circle r="10"/></svg>\n```';
        const editor = createEditor('Before\n\nAfter');
        editor.commands.insertContentAt(8, { type: 'codeBlock', attrs: { language: 'html-preview' }, content: [{ type: 'text', text: source }] });
        const saved = markdown(editor);
        expect(saved).toContain('````html-preview');
        const reopened = createEditor(saved);
        expect(reopened.getJSON()).toEqual(editor.getJSON());
        expect(reopened.state.doc.child(1).textContent).toBe(source);
    });

    it.each(['<p>Preview</p>\n', '<p>Preview</p>\n\n', '<p>Preview</p>  '])('preserves trailing whitespace in preview source %j', source => {
        const editor = createEditor('');
        editor.commands.insertContent({ type: 'codeBlock', attrs: { language: 'html-preview' }, content: [{ type: 'text', text: source }] });
        const reopened = createEditor(markdown(editor));
        expect(reopened.state.doc.child(0).textContent).toBe(source);
    });

    it('does not change normal HTML and SVG code blocks into previews', () => {
        const editor = createEditor('```html\n<b>Example</b>\n```\n\n```svg\n<svg/>\n```');
        expect(editor.state.doc.child(0).attrs.language).toBe('html');
        expect(editor.state.doc.child(1).attrs.language).toBe('svg');
        expect(markdown(editor)).not.toContain('html-preview');
    });

    it('inserts images at the saved position and supports undo', () => {
        const editor = createEditor('Before\n\nAfter');
        editor.chain().insertContentAt(8, { type: 'image', attrs: { src: '/example.png', alt: 'Alt' } }).run();
        expect(markdown(editor)).toBe('Before\n\n![Alt](/example.png)\n\nAfter');
        editor.commands.undo();
        expect(markdown(editor)).toBe('Before\n\nAfter');
    });

    it('rejects unsafe images pasted as HTML', () => {
        const editor = createEditor('');
        editor.commands.setContent('<img src="javascript:alert(1)"><img src="data:image/svg+xml,test"><img src="/valid.png">');
        expect(editor.getHTML()).not.toContain('javascript:');
        expect(editor.getHTML()).not.toContain('data:image');
        expect(editor.getHTML()).toContain('/valid.png');
    });
});

describe('preview sizing', () => {
    it('fits the content, responds to container width changes and disconnects on cleanup', () => {
        const callbacks: ResizeObserverCallback[] = [];
        const observers: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];
        vi.stubGlobal('ResizeObserver', class {
            observe = vi.fn();
            disconnect = vi.fn();
            constructor(callback: ResizeObserverCallback) { callbacks.push(callback); observers.push(this); }
        });
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1; });
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
        const parent = document.createElement('div');
        const frame = document.createElement('iframe');
        document.body.append(parent);
        parent.append(frame);
        let parentWidth = 600;
        Object.defineProperty(parent, 'clientWidth', { get: () => parentWidth });
        const body = frame.contentDocument!.body;
        vi.spyOn(body, 'getBoundingClientRect').mockImplementation(() => ({ left: 0, top: 0, right: Math.min(240, parentWidth), bottom: 90 }) as DOMRect);
        const cleanup = autoSizePreview(frame);
        try {
            expect(frame.style.width).toBe('240px');
            expect(frame.style.height).toBe('90px');
            expect(frame.style.background).toBe('transparent');
            parentWidth = 180;
            callbacks[0]([{ contentRect: { width: 180 } } as ResizeObserverEntry], observers[0] as unknown as ResizeObserver);
            expect(frame.style.width).toBe('180px');
            cleanup();
            expect(observers.every(observer => observer.disconnect.mock.calls.length > 0)).toBe(true);
            const observerCount = observers.length;
            frame.dispatchEvent(new Event('load'));
            expect(observers).toHaveLength(observerCount);
        } finally {
            cleanup();
            parent.remove();
            vi.restoreAllMocks();
            vi.unstubAllGlobals();
        }
    });
});

describe('preview isolation', () => {
    it('uses transparent, content-sized defaults without injected padding', () => {
        const html = previewDocument('<svg width="120" height="60"></svg>');
        expect(html).toContain('background:transparent');
        expect(html).toContain('margin:0');
        expect(html).toContain('width:fit-content');
        expect(html).not.toContain('background:#fff');
    });
    it('uses the viewBox as the intrinsic SVG size without replacing explicit dimensions', () => {
        const html = new DOMParser().parseFromString(previewDocument('<svg viewBox="0 0 400 200"></svg><svg width="90" viewBox="0 0 400 200"></svg>'), 'text/html');
        const svgs = html.querySelectorAll('svg');
        expect(svgs[0].getAttribute('width')).toBe('400');
        expect(svgs[0].getAttribute('height')).toBe('200');
        expect(svgs[1].getAttribute('width')).toBe('90');
        expect(svgs[1].hasAttribute('height')).toBe(false);
    });

    it('removes navigation and active elements while preserving SVG and CSS', () => {
        const html = previewDocument('<meta http-equiv="refresh" content="0;url=https://example.com"><a href="https://example.com">Link</a><script>alert(1)</script><style>p{color:red}</style><svg><circle r="10"/><animate attributeName="href"/></svg>');
        expect(html).toContain(previewCsp);
        expect(html).toContain('<circle');
        expect(html).toContain('p{color:red}');
        expect(html).not.toContain('https://example.com');
        expect(html).not.toContain('<script');
        expect(html).not.toContain('<animate');
    });

    it.each(['/storage/photo.png', 'https://example.com/photo.png', 'http://example.com/photo.png'])('accepts safe image URL %s', value => {
        expect(isImageUrl(value)).toBe(true);
    });
    it.each(['javascript:alert(1)', 'data:image/svg+xml,test', '//example.com/photo.png', '/\\example.com', 'blob:test', '', '/photo\n.png'])('rejects image URL %s', value => {
        expect(isImageUrl(value)).toBe(false);
    });
});
