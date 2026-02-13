export interface EmailBlock {
  id: string;
  type: 'header' | 'text' | 'image' | 'button' | 'footer' | 'divider' | 'spacer' | 'columns';
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

export function blocksToHtml(blocks: EmailBlock[], bodyBg: string = '#ffffff', contentBg: string = '#ffffff'): string {
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
      default:
        return '';
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:${bodyBg};font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${bodyBg};">
<tr><td align="center" style="padding:20px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background-color:${contentBg};border-radius:8px;overflow:hidden;">
${blockHtmls}
</table>
</td></tr>
</table>
</body></html>`;
}
