import { useEffect, useRef } from 'react';

export function autoSizePreview(frame: HTMLIFrameElement): () => void {
    let contentObserver: ResizeObserver | undefined;
    let animationFrame = 0;
    let parentWidth = -1;

    const resize = () => {
        const body = frame.contentDocument?.body;
        const parent = frame.parentElement;
        if (!body || !parent || !parent.clientWidth) return;

        frame.style.width = `${parent.clientWidth}px`;
        frame.style.height = '0px';
        const measure = () => {
            const bounds = body.getBoundingClientRect();
            let right = Math.max(bounds.right, body.scrollWidth + bounds.left, 0);
            let bottom = Math.max(bounds.bottom, body.scrollHeight + bounds.top, 0);
            for (const element of body.querySelectorAll('*')) {
                for (const rect of element.getClientRects()) {
                    right = Math.max(right, rect.right);
                    bottom = Math.max(bottom, rect.bottom);
                }
            }
            return { right, bottom };
        };
        frame.style.width = `${Math.min(parent.clientWidth, Math.ceil(measure().right))}px`;
        frame.style.height = `${Math.ceil(measure().bottom)}px`;
    };
    const schedule = () => {
        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(resize);
    };
    const onLoad = () => {
        contentObserver?.disconnect();
        const body = frame.contentDocument?.body;
        if (!body) return;
        contentObserver = new ResizeObserver(schedule);
        contentObserver.observe(body);
        for (const element of body.querySelectorAll('*')) contentObserver.observe(element);
        schedule();
    };
    const parentObserver = new ResizeObserver(entries => {
        const width = entries[0].contentRect.width;
        if (width === parentWidth) return;
        parentWidth = width;
        schedule();
    });

    Object.assign(frame.style, { display: 'block', maxWidth: '100%', border: '0', borderRadius: '0', background: 'transparent' });
    frame.addEventListener('load', onLoad);
    if (frame.parentElement) parentObserver.observe(frame.parentElement);
    if (frame.contentDocument?.readyState === 'complete') onLoad();

    return () => {
        frame.removeEventListener('load', onLoad);
        contentObserver?.disconnect();
        parentObserver.disconnect();
        cancelAnimationFrame(animationFrame);
    };
}

export default function BlogPreviewFrame({ source, title = 'HTML / SVG' }: { source: string; title?: string }) {
    const ref = useRef<HTMLIFrameElement>(null);
    useEffect(() => {
        if (ref.current) return autoSizePreview(ref.current);
    }, []);

    return <iframe ref={ref} title={title} srcDoc={source} sandbox="allow-same-origin" referrerPolicy="no-referrer" style={{ display: 'block', width: '100%', height: 0, maxWidth: '100%', border: 0, background: 'transparent' }} />;
}
