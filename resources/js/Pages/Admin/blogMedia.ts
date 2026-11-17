export const previewCsp = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'";

export function previewDocument(source: string): string {
    const document = new DOMParser().parseFromString(source, 'text/html');

    for (const element of document.querySelectorAll('meta, base, script, iframe, object, embed, link, animate, set, animateMotion, animateTransform')) {
        element.remove();
    }
    for (const element of document.querySelectorAll('a, area')) {
        element.removeAttribute('href');
        element.removeAttribute('xlink:href');
        element.removeAttribute('target');
    }

    const policy = document.createElement('meta');
    policy.httpEquiv = 'Content-Security-Policy';
    policy.content = previewCsp;
    document.head.prepend(policy);
    const charset = document.createElement('meta');
    charset.setAttribute('charset', 'UTF-8');
    document.head.append(charset);
    const style = document.createElement('style');
    style.textContent = 'html{color-scheme:light;background:#fff;color:#0f172a}body{margin:16px;overflow-wrap:anywhere}img,svg{max-width:100%;height:auto}*{box-sizing:border-box}';
    document.head.append(style);

    return '<!doctype html>' + document.documentElement.outerHTML;
}

export function isImageUrl(value: string): boolean {
    if (!value || /[\s\\\x00-\x1f\x7f]/.test(value)) return false;
    if (value.startsWith('/') && !value.startsWith('//')) return true;
    try {
        return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
        return false;
    }
}
