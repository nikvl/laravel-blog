import { useEffect, useMemo, useRef, useState } from 'react';
import { isImageUrl, previewDocument } from './blogMedia';
import BlogPreviewFrame from '../BlogPreviewFrame';

export type MediaInsert = { kind: 'image'; src: string; alt: string } | { kind: 'code'; source: string };

interface Props {
    kind: 'image' | 'code';
    initialSource: string;
    uploadUrl: string;
    onInsert: (media: MediaInsert) => void;
    onClose: () => void;
    onBusy: (busy: boolean) => void;
}

const fieldStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 6,
    border: '1px solid #334155', background: '#0f1623', color: '#f8fafc', fontSize: 14,
};
const buttonStyle: React.CSSProperties = {
    padding: '8px 16px', borderRadius: 6, border: '1px solid #334155', background: 'none', color: '#cbd5e1', cursor: 'pointer',
};

export default function BlogMediaDialog({ kind, initialSource, uploadUrl, onInsert, onClose, onBusy }: Props) {
    const dialog = useRef<HTMLDialogElement>(null);
    const [tab, setTab] = useState<'file' | 'url'>('file');
    const [url, setUrl] = useState('');
    const [alt, setAlt] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [source, setSource] = useState(initialSource);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const preview = useMemo(() => kind === 'code' ? previewDocument(source) : '', [kind, source]);

    useEffect(() => {
        const element = dialog.current;
        element?.showModal();
        return () => element?.close();
    }, []);

    async function insert() {
        if (busy) return;
        setError('');
        if (kind === 'code') {
            if (!source.trim()) return setError('Вставьте SVG или HTML-код.');
            onInsert({ kind, source });
            return;
        }
        if (tab === 'url') {
            if (!isImageUrl(url.trim())) return setError('Укажите HTTP(S)-ссылку или локальный путь, начинающийся с /.');
            onInsert({ kind, src: url.trim(), alt });
            return;
        }
        if (!file) return setError('Выберите изображение.');
        if (file.size > 4 * 1024 * 1024) return setError('Максимальный размер — 4 МБ.');

        setBusy(true);
        onBusy(true);
        try {
            const form = new FormData();
            form.append('image', file);
            const headers: Record<string, string> = { Accept: 'application/json' };
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const xsrf = document.cookie.split('; ').find(value => value.startsWith('XSRF-TOKEN='))?.slice('XSRF-TOKEN='.length);
            if (token) headers['X-CSRF-TOKEN'] = token;
            else if (xsrf) headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrf);
            const response = await fetch(uploadUrl, { method: 'POST', body: form, headers, credentials: 'same-origin' });
            if (response.status === 419) throw new Error('Сессия истекла. Обновите страницу перед загрузкой.');
            const data = await response.json() as { url?: string; message?: string; errors?: { image?: string[] } };
            if (!response.ok) throw new Error(data.errors?.image?.[0] ?? data.message ?? 'Не удалось загрузить изображение.');
            if (typeof data.url !== 'string' || !isImageUrl(data.url)) throw new Error('Сервер вернул некорректную ссылку изображения.');
            onInsert({ kind, src: data.url, alt });
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Не удалось загрузить изображение.');
        } finally {
            setBusy(false);
            onBusy(false);
        }
    }

    return (
        <dialog
            ref={dialog}
            aria-labelledby="blog-media-title"
            onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
            style={{ width: kind === 'code' ? 960 : 520, maxWidth: 'calc(100vw - 32px)', maxHeight: '90vh', overflow: 'auto', boxSizing: 'border-box', padding: 24, border: '1px solid #334155', borderRadius: 12, background: '#101827', color: '#f8fafc', boxShadow: '0 24px 80px #0008' }}
        >
            <style>{'dialog::backdrop{background:rgba(2,6,23,.75)}'}</style>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 id="blog-media-title" style={{ margin: 0, fontSize: 20 }}>{kind === 'image' ? 'Изображение в тексте' : 'SVG / HTML-вставка'}</h2>
                <button type="button" aria-label="Закрыть" disabled={busy} onClick={onClose} style={buttonStyle}>×</button>
            </div>
            {kind === 'image' ? (
                <div style={{ display: 'grid', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {(['file', 'url'] as const).map(value => (
                            <button key={value} type="button" aria-pressed={tab === value} disabled={busy} onClick={() => { setTab(value); setError(''); }} style={{ ...buttonStyle, borderColor: tab === value ? '#38bdf8' : '#334155', color: tab === value ? '#38bdf8' : '#94a3b8' }}>
                                {value === 'file' ? 'Загрузить файл' : 'По ссылке'}
                            </button>
                        ))}
                    </div>
                    {tab === 'file' ? (
                        <label style={{ display: 'grid', gap: 8, fontSize: 13, color: '#94a3b8' }}>
                            JPEG, PNG, WebP или GIF, до 4 МБ
                            <input autoFocus type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={event => setFile(event.target.files?.[0] ?? null)} style={fieldStyle} />
                        </label>
                    ) : (
                        <label style={{ display: 'grid', gap: 8, fontSize: 13, color: '#94a3b8' }}>
                            Ссылка на изображение
                            <input autoFocus type="text" value={url} disabled={busy} onChange={event => setUrl(event.target.value)} placeholder="https://… или /storage/…" style={fieldStyle} />
                        </label>
                    )}
                    <label style={{ display: 'grid', gap: 8, fontSize: 13, color: '#94a3b8' }}>
                        Описание изображения (alt)
                        <input value={alt} disabled={busy} onChange={event => setAlt(event.target.value)} style={fieldStyle} />
                    </label>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#94a3b8' }}>HTML, CSS и SVG отображаются изолированно. JavaScript, внешние ресурсы и переходы по ссылкам отключены.</p>
                    <label htmlFor="blog-media-source" style={{ fontSize: 12, color: '#94a3b8' }}>Исходный код</label>
                    <textarea id="blog-media-source" autoFocus value={source} onChange={event => setSource(event.target.value)} spellCheck={false} placeholder={'<svg viewBox="0 0 400 200">…</svg>'} style={{ ...fieldStyle, height: 220, resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.5 }} />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Предпросмотр</span>
                    <BlogPreviewFrame title="Предпросмотр SVG / HTML" source={preview} />
                </div>
            )}
            {error && <p role="alert" style={{ fontSize: 13, color: '#fca5a5', marginBottom: 0 }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" disabled={busy} onClick={onClose} style={buttonStyle}>Отмена</button>
                <button type="button" disabled={busy} onClick={insert} style={{ ...buttonStyle, background: '#38bdf8', borderColor: '#38bdf8', color: '#040914', fontWeight: 600, opacity: busy ? 0.6 : 1 }}>
                    {busy ? 'Загрузка…' : 'Вставить'}
                </button>
            </div>
        </dialog>
    );
}
