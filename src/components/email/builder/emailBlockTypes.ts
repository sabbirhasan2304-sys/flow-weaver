export interface EmailBlock {
  id: string;
  type: 'header' | 'text' | 'image' | 'button' | 'footer' | 'divider' | 'spacer' | 'columns' | 'social' | 'video' | 'countdown' | 'product' | 'html';
  content: Record<string, any>;
}

export const DEFAULT_BLOCK_CONTENT: Record<EmailBlock['type'], Record<string, any>> = {
  header: {
    text: 'Your Email Header',
    fontSize: '28',
    fontWeight: 'bold',
    color: '#1a1a2e',
    backgroundColor: '#f8f9fa',
    padding: '30',
    align: 'center',
  },
  text: {
    text: 'Write your email content here. You can use merge tags like {{first_name}} for personalization.',
    fontSize: '16',
    color: '#333333',
    lineHeight: '1.6',
    padding: '16',
    align: 'left',
  },
  image: {
    src: '',
    alt: 'Image',
    width: '100',
    align: 'center',
    padding: '16',
    link: '',
  },
  button: {
    text: 'Click Here',
    link: 'https://',
    backgroundColor: '#0d9668',
    color: '#ffffff',
    fontSize: '16',
    borderRadius: '6',
    padding: '14',
    align: 'center',
    fullWidth: false,
  },
  footer: {
    text: '© 2026 Your Company. All rights reserved.\nYou received this because you subscribed.',
    fontSize: '13',
    color: '#999999',
    backgroundColor: '#f8f9fa',
    padding: '24',
    align: 'center',
    showUnsubscribe: true,
  },
  divider: {
    color: '#e0e0e0',
    thickness: '1',
    padding: '16',
    width: '100',
  },
  spacer: {
    height: '24',
  },
  columns: {
    columns: 2,
    gap: '16',
    padding: '16',
    col1_text: 'Column 1 content',
    col2_text: 'Column 2 content',
    col3_text: 'Column 3 content',
    backgroundColor: '',
  },
  social: {
    padding: '16',
    align: 'center',
    iconSize: '32',
    iconColor: '#333333',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
    label: 'Follow us',
    showLabel: true,
  },
  video: {
    videoUrl: '',
    thumbnailUrl: '',
    alt: 'Watch video',
    width: '100',
    padding: '16',
    align: 'center',
    playButtonColor: '#ff0000',
  },
  countdown: {
    targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    label: 'Offer ends in',
    backgroundColor: '#1e293b',
    textColor: '#ffffff',
    accentColor: '#f59e0b',
    padding: '24',
    align: 'center',
    showDays: true,
    showHours: true,
    showMinutes: true,
    showSeconds: true,
  },
  product: {
    name: 'Product Name',
    description: 'A short description of this amazing product.',
    price: '$49.99',
    originalPrice: '$79.99',
    imageUrl: '',
    buttonText: 'Buy Now',
    buttonLink: 'https://',
    buttonColor: '#0d9668',
    buttonTextColor: '#ffffff',
    padding: '16',
    layout: 'horizontal',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  html: {
    code: '<div style="padding:16px;text-align:center;color:#666;">Custom HTML content</div>',
    padding: '0',
  },
};

export function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlock(type: EmailBlock['type']): EmailBlock {
  return {
    id: generateBlockId(),
    type,
    content: { ...DEFAULT_BLOCK_CONTENT[type] },
  };
}

function socialIconSvg(platform: string, color: string, size: string): string {
  const paths: Record<string, string> = {
    facebook: `<path fill="${color}" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>`,
    twitter: `<path fill="${color}" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>`,
    instagram: `<path fill="${color}" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>`,
    linkedin: `<path fill="${color}" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>`,
    youtube: `<path fill="${color}" d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>`,
    tiktok: `<path fill="${color}" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">${paths[platform] || ''}</svg>`;
}

export function blocksToHtml(blocks: EmailBlock[], bodyBg: string = '#f4f4f5', contentBg: string = '#ffffff', fontFamily: string = 'Arial, Helvetica, sans-serif'): string {
  const blockHtmls = blocks.map(block => {
    switch (block.type) {
      case 'header':
        return `<tr><td style="background-color:${block.content.backgroundColor};padding:${block.content.padding}px;text-align:${block.content.align};">
          <h1 style="margin:0;font-size:${block.content.fontSize}px;font-weight:${block.content.fontWeight};color:${block.content.color};">${block.content.text}</h1>
        </td></tr>`;
      case 'text':
        return `<tr><td style="padding:${block.content.padding}px;text-align:${block.content.align};">
          <p style="margin:0;font-size:${block.content.fontSize}px;color:${block.content.color};line-height:${block.content.lineHeight};">${block.content.text.replace(/\n/g, '<br/>')}</p>
        </td></tr>`;
      case 'image':
        const imgTag = `<img src="${block.content.src}" alt="${block.content.alt}" style="max-width:${block.content.width}%;height:auto;display:block;${block.content.align === 'center' ? 'margin:0 auto;' : ''}" />`;
        const wrappedImg = block.content.link ? `<a href="${block.content.link}" target="_blank">${imgTag}</a>` : imgTag;
        return `<tr><td style="padding:${block.content.padding}px;text-align:${block.content.align};">${wrappedImg}</td></tr>`;
      case 'button':
        const btnWidth = block.content.fullWidth ? 'display:block;width:100%;' : 'display:inline-block;';
        return `<tr><td style="padding:${block.content.padding}px;text-align:${block.content.align};">
          <a href="${block.content.link}" target="_blank" style="${btnWidth}background-color:${block.content.backgroundColor};color:${block.content.color};font-size:${block.content.fontSize}px;text-decoration:none;padding:12px 28px;border-radius:${block.content.borderRadius}px;font-weight:600;">${block.content.text}</a>
        </td></tr>`;
      case 'footer':
        const unsubLink = block.content.showUnsubscribe ? '<br/><a href="{{unsubscribe_url}}" style="color:#999;">Unsubscribe</a>' : '';
        return `<tr><td style="background-color:${block.content.backgroundColor};padding:${block.content.padding}px;text-align:${block.content.align};">
          <p style="margin:0;font-size:${block.content.fontSize}px;color:${block.content.color};line-height:1.5;">${block.content.text.replace(/\n/g, '<br/>')}${unsubLink}</p>
        </td></tr>`;
      case 'divider':
        return `<tr><td style="padding:${block.content.padding}px 0;">
          <hr style="border:none;border-top:${block.content.thickness}px solid ${block.content.color};width:${block.content.width}%;margin:0 auto;" />
        </td></tr>`;
      case 'spacer':
        return `<tr><td style="height:${block.content.height}px;"></td></tr>`;
      case 'columns': {
        const colCount = Number(block.content.columns) || 2;
        const gap = block.content.gap || '16';
        const bg = block.content.backgroundColor ? `background-color:${block.content.backgroundColor};` : '';
        const colWidth = Math.floor(100 / colCount);
        let cols = '';
        for (let i = 1; i <= colCount; i++) {
          const text = block.content[`col${i}_text`] || '';
          cols += `<td style="width:${colWidth}%;padding:${gap}px;vertical-align:top;font-size:14px;color:#333;">${text.replace(/\n/g, '<br/>')}</td>`;
        }
        return `<tr><td style="padding:${block.content.padding}px;${bg}">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>${cols}</tr></table>
        </td></tr>`;
      }
      case 'social': {
        const platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'];
        const size = block.content.iconSize || '32';
        const color = block.content.iconColor || '#333333';
        const icons = platforms
          .filter(p => block.content[p])
          .map(p => `<a href="${block.content[p]}" target="_blank" style="display:inline-block;margin:0 6px;">${socialIconSvg(p, color, size)}</a>`)
          .join('');
        const labelHtml = block.content.showLabel && block.content.label
          ? `<p style="margin:0 0 8px;font-size:14px;color:#666;">${block.content.label}</p>` : '';
        return `<tr><td style="padding:${block.content.padding}px;text-align:${block.content.align};">
          ${labelHtml}${icons || '<p style="color:#999;font-size:13px;">Add social links in settings</p>'}
        </td></tr>`;
      }
      case 'video': {
        const videoUrl = block.content.videoUrl || '';
        const thumb = block.content.thumbnailUrl || getVideoThumbnail(videoUrl);
        const playColor = block.content.playButtonColor || '#ff0000';
        const playSvg = `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:68px;height:48px;background:${playColor};border-radius:12px;display:flex;align-items:center;justify-content:center;">
          <div style="width:0;height:0;border-left:20px solid #fff;border-top:12px solid transparent;border-bottom:12px solid transparent;margin-left:4px;"></div>
        </div>`;
        const thumbImg = thumb
          ? `<img src="${thumb}" alt="${block.content.alt}" style="max-width:${block.content.width}%;height:auto;display:block;${block.content.align === 'center' ? 'margin:0 auto;' : ''}" />`
          : `<div style="max-width:${block.content.width}%;height:200px;background:#f0f0f0;margin:0 auto;display:flex;align-items:center;justify-content:center;border-radius:8px;"><span style="color:#999;">Video thumbnail</span></div>`;
        return `<tr><td style="padding:${block.content.padding}px;text-align:${block.content.align};">
          <a href="${videoUrl}" target="_blank" style="display:inline-block;position:relative;text-decoration:none;">
            ${thumbImg}${playSvg}
          </a>
        </td></tr>`;
      }
      case 'countdown': {
        const c = block.content;
        const units = [
          c.showDays && 'DD',
          c.showHours && 'HH',
          c.showMinutes && 'MM',
          c.showSeconds && 'SS',
        ].filter(Boolean);
        const unitLabels: Record<string, string> = { DD: 'Days', HH: 'Hours', MM: 'Minutes', SS: 'Seconds' };
        const boxes = units.map(u => `<td style="text-align:center;padding:8px 12px;">
          <div style="font-size:28px;font-weight:bold;color:${c.accentColor};">00</div>
          <div style="font-size:11px;color:${c.textColor};opacity:0.7;">${unitLabels[u as string]}</div>
        </td>`).join('<td style="font-size:24px;color:' + c.textColor + ';opacity:0.5;">:</td>');
        return `<tr><td style="background-color:${c.backgroundColor};padding:${c.padding}px;text-align:${c.align};">
          ${c.label ? `<p style="margin:0 0 12px;font-size:14px;color:${c.textColor};opacity:0.8;">${c.label}</p>` : ''}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>${boxes}</tr></table>
          <p style="margin:8px 0 0;font-size:11px;color:${c.textColor};opacity:0.5;">Ends ${c.targetDate}</p>
        </td></tr>`;
      }
      case 'product': {
        const p = block.content;
        const imgHtml = p.imageUrl
          ? `<img src="${p.imageUrl}" alt="${p.name}" style="width:100%;max-width:200px;height:auto;border-radius:8px;" />`
          : `<div style="width:200px;height:150px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;margin:0 auto;"><span style="color:#999;">Product image</span></div>`;
        const priceHtml = p.originalPrice
          ? `<span style="text-decoration:line-through;color:#999;font-size:14px;margin-right:8px;">${p.originalPrice}</span><span style="font-size:20px;font-weight:bold;color:#111;">${p.price}</span>`
          : `<span style="font-size:20px;font-weight:bold;color:#111;">${p.price}</span>`;
        return `<tr><td style="padding:${p.padding}px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${p.borderColor};border-radius:8px;overflow:hidden;background:${p.backgroundColor};">
          <tr>
            <td style="padding:16px;text-align:center;width:40%;">${imgHtml}</td>
            <td style="padding:16px;vertical-align:middle;">
              <h3 style="margin:0 0 8px;font-size:18px;color:#111;">${p.name}</h3>
              <p style="margin:0 0 12px;font-size:14px;color:#666;line-height:1.4;">${p.description}</p>
              <div style="margin-bottom:16px;">${priceHtml}</div>
              <a href="${p.buttonLink}" target="_blank" style="display:inline-block;background:${p.buttonColor};color:${p.buttonTextColor};padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">${p.buttonText}</a>
            </td>
          </tr></table>
        </td></tr>`;
      }
      case 'html':
        return `<tr><td style="padding:${block.content.padding}px;">${block.content.code}</td></tr>`;
      default:
        return '';
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>@media only screen and (max-width:480px){.email-container{width:100%!important;}.email-col{display:block!important;width:100%!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:${bodyBg};font-family:${fontFamily};">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${bodyBg};">
<tr><td align="center" style="padding:20px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width:600px;width:100%;background-color:${contentBg};border-radius:8px;overflow:hidden;">
${blockHtmls}
</table>
</td></tr>
</table>
</body></html>`;
}

function getVideoThumbnail(url: string): string {
  if (!url) return '';
  // YouTube
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?#]+)/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
  // Vimeo - can't get thumbnail without API, return empty
  return '';
}
