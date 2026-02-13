import { EmailBlock, createBlock } from './emailBlockTypes';

interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryColor: string;
  subject: string;
  previewText: string;
  blocks: EmailBlock[];
}

function makeBlock(type: EmailBlock['type'], overrides: Record<string, any>): EmailBlock {
  const b = createBlock(type);
  return { ...b, content: { ...b.content, ...overrides } };
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Greet new subscribers with a warm introduction',
    category: 'Onboarding',
    categoryColor: 'bg-emerald-500/10 text-emerald-600',
    subject: 'Welcome to {{company}}! 🎉',
    previewText: 'Header → Welcome text → CTA → Footer',
    blocks: [
      makeBlock('header', { text: 'Welcome Aboard! 🎉', backgroundColor: '#0f766e', color: '#ffffff', fontSize: '32', padding: '40' }),
      makeBlock('text', { text: 'Hi {{first_name}},\n\nWelcome to our community! We\'re thrilled to have you on board.\n\nHere\'s what you can expect from us:\n• Exclusive updates and insights\n• Tips and tutorials to get started\n• Special offers just for you', padding: '24' }),
      makeBlock('button', { text: 'Get Started →', link: 'https://', backgroundColor: '#0f766e', borderRadius: '8' }),
      makeBlock('divider', { padding: '24' }),
      makeBlock('footer', { text: '© 2026 Your Company\nYou received this because you signed up.', showUnsubscribe: true }),
    ],
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Clean newsletter layout with featured content',
    category: 'Newsletter',
    categoryColor: 'bg-blue-500/10 text-blue-600',
    subject: 'Your Weekly Update 📬',
    previewText: 'Logo → Featured → Columns → CTA → Footer',
    blocks: [
      makeBlock('header', { text: 'Weekly Newsletter', backgroundColor: '#1e40af', color: '#ffffff', fontSize: '28', padding: '32' }),
      makeBlock('text', { text: 'Hi {{first_name}},\n\nHere\'s your weekly roundup of the latest news, tips, and updates from our team.', padding: '20' }),
      makeBlock('image', { src: '', alt: 'Featured image', width: '100', padding: '16' }),
      makeBlock('text', { text: 'Featured Story\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', fontSize: '15', padding: '16' }),
      makeBlock('columns', { columns: 2, col1_text: '📊 Article One\n\nShort summary of the first article with key takeaways.', col2_text: '🚀 Article Two\n\nShort summary of the second article with key takeaways.', padding: '16' }),
      makeBlock('button', { text: 'Read More', link: 'https://', backgroundColor: '#1e40af', borderRadius: '6' }),
      makeBlock('divider', {}),
      makeBlock('footer', { text: '© 2026 Your Company\nYou\'re receiving this as a subscriber.', showUnsubscribe: true }),
    ],
  },
  {
    id: 'promotional',
    name: 'Promotional Offer',
    description: 'Eye-catching promotional email with CTA',
    category: 'Marketing',
    categoryColor: 'bg-purple-500/10 text-purple-600',
    subject: '🔥 Limited Time: {{discount}}% Off Everything!',
    previewText: 'Bold header → Offer details → CTA → Social',
    blocks: [
      makeBlock('header', { text: '🔥 FLASH SALE', backgroundColor: '#7c3aed', color: '#ffffff', fontSize: '36', padding: '40' }),
      makeBlock('text', { text: 'For a limited time only, enjoy incredible savings on our entire collection. Don\'t miss out!', fontSize: '18', align: 'center', color: '#4b5563', padding: '20' }),
      makeBlock('image', { src: '', alt: 'Sale banner', width: '100', padding: '8' }),
      makeBlock('button', { text: 'SHOP NOW — 50% OFF', link: 'https://', backgroundColor: '#dc2626', color: '#ffffff', fontSize: '18', borderRadius: '8', fullWidth: true }),
      makeBlock('spacer', { height: '16' }),
      makeBlock('text', { text: 'Use code SAVE50 at checkout\nOffer expires midnight Sunday', align: 'center', fontSize: '14', color: '#6b7280' }),
      makeBlock('divider', { padding: '24' }),
      makeBlock('social', { showLabel: true, label: 'Follow us for more deals' }),
      makeBlock('footer', { text: '© 2026 Your Company', showUnsubscribe: true }),
    ],
  },
  {
    id: 'announcement',
    name: 'Product Announcement',
    description: 'Announce a new product or feature launch',
    category: 'Product',
    categoryColor: 'bg-amber-500/10 text-amber-600',
    subject: 'Introducing {{product_name}} — Something Amazing',
    previewText: 'Hero → Features → Image → CTA',
    blocks: [
      makeBlock('header', { text: 'Something New is Here ✨', backgroundColor: '#f59e0b', color: '#1a1a2e', fontSize: '30', padding: '36' }),
      makeBlock('text', { text: 'Hi {{first_name}},\n\nWe\'re excited to announce our latest launch. We\'ve been working hard to bring you something truly special.', padding: '20' }),
      makeBlock('image', { src: '', alt: 'Product screenshot', width: '90', padding: '16' }),
      makeBlock('columns', { columns: 3, col1_text: '⚡ Fast\nBlazing fast performance', col2_text: '🔒 Secure\nEnterprise-grade security', col3_text: '🎨 Beautiful\nStunning modern design', padding: '16' }),
      makeBlock('button', { text: 'Learn More', link: 'https://', backgroundColor: '#f59e0b', color: '#1a1a2e', borderRadius: '8' }),
      makeBlock('footer', { text: '© 2026 Your Company', showUnsubscribe: true }),
    ],
  },
  {
    id: 'cart-recovery',
    name: 'Abandoned Cart',
    description: 'Recover lost sales with a cart reminder',
    category: 'E-commerce',
    categoryColor: 'bg-red-500/10 text-red-600',
    subject: 'You left something behind! 🛒',
    previewText: 'Reminder → Cart items → CTA → Support',
    blocks: [
      makeBlock('header', { text: 'Forgot Something? 🛒', backgroundColor: '#ef4444', color: '#ffffff', fontSize: '28', padding: '32' }),
      makeBlock('text', { text: 'Hi {{first_name}},\n\nLooks like you left some items in your cart. Don\'t worry — they\'re still waiting for you!', padding: '20' }),
      makeBlock('divider', { padding: '8' }),
      makeBlock('text', { text: 'Your cart items:\n\n• Item 1 — $29.99\n• Item 2 — $49.99\n\nSubtotal: $79.98', fontSize: '15', padding: '16' }),
      makeBlock('button', { text: 'Complete Your Order →', link: 'https://', backgroundColor: '#ef4444', borderRadius: '8', fullWidth: true }),
      makeBlock('spacer', { height: '12' }),
      makeBlock('text', { text: 'Need help? Reply to this email or contact our support team.', fontSize: '13', color: '#9ca3af', align: 'center' }),
      makeBlock('footer', { text: '© 2026 Your Store', showUnsubscribe: true }),
    ],
  },
  {
    id: 'event-invite',
    name: 'Event Invitation',
    description: 'Invite contacts to webinars, meetups, or conferences',
    category: 'Events',
    categoryColor: 'bg-pink-500/10 text-pink-600',
    subject: 'You\'re Invited! 🎟️ {{event_name}}',
    previewText: 'Header → Event details → Countdown → CTA',
    blocks: [
      makeBlock('header', { text: '🎟️ You\'re Invited!', backgroundColor: '#be185d', color: '#ffffff', fontSize: '32', padding: '40' }),
      makeBlock('text', { text: 'Hi {{first_name}},\n\nWe\'d love to have you at our upcoming event. Join industry leaders and peers for an unforgettable experience.', padding: '20' }),
      makeBlock('countdown', { label: 'Event starts in', backgroundColor: '#1e293b', textColor: '#ffffff', accentColor: '#ec4899' }),
      makeBlock('columns', { columns: 2, col1_text: '📅 Date\nMarch 15, 2026\n10:00 AM EST', col2_text: '📍 Location\nVirtual Event\nZoom Webinar', padding: '16' }),
      makeBlock('button', { text: 'Register Now →', link: 'https://', backgroundColor: '#be185d', borderRadius: '8' }),
      makeBlock('footer', { text: '© 2026 Your Company', showUnsubscribe: true }),
    ],
  },
  {
    id: 'feedback',
    name: 'Feedback Request',
    description: 'Ask customers for reviews or survey responses',
    category: 'Engagement',
    categoryColor: 'bg-cyan-500/10 text-cyan-600',
    subject: 'We\'d love your feedback! 💬',
    previewText: 'Header → Ask → Rating → CTA',
    blocks: [
      makeBlock('header', { text: 'How Are We Doing? 💬', backgroundColor: '#0891b2', color: '#ffffff', fontSize: '28', padding: '32' }),
      makeBlock('text', { text: 'Hi {{first_name}},\n\nYour opinion matters to us! We\'d love to hear about your experience. It only takes 2 minutes.', padding: '20' }),
      makeBlock('text', { text: '⭐⭐⭐⭐⭐\n\nRate your experience above, or click below to share detailed feedback.', align: 'center', fontSize: '18', padding: '16' }),
      makeBlock('button', { text: 'Share Feedback', link: 'https://', backgroundColor: '#0891b2', borderRadius: '8' }),
      makeBlock('spacer', { height: '16' }),
      makeBlock('text', { text: 'As a thank you, we\'ll send you a 10% discount code after completing the survey!', fontSize: '14', color: '#6b7280', align: 'center' }),
      makeBlock('footer', { text: '© 2026 Your Company', showUnsubscribe: true }),
    ],
  },
  {
    id: 'product-launch',
    name: 'Product Showcase',
    description: 'Showcase a product with pricing and buy button',
    category: 'E-commerce',
    categoryColor: 'bg-red-500/10 text-red-600',
    subject: 'New Arrival: {{product_name}} 🆕',
    previewText: 'Header → Product card → CTA → Social',
    blocks: [
      makeBlock('header', { text: 'New Arrival 🆕', backgroundColor: '#1a1a2e', color: '#ffffff', fontSize: '28', padding: '32' }),
      makeBlock('text', { text: 'Check out our latest addition to the collection.', align: 'center', fontSize: '16', color: '#6b7280', padding: '12' }),
      makeBlock('product', { name: 'Premium Wireless Headphones', description: 'Crystal-clear audio with 40hr battery life and active noise cancellation.', price: '$149.99', originalPrice: '$199.99', buttonText: 'Shop Now', buttonLink: 'https://', buttonColor: '#0d9668' }),
      makeBlock('divider', { padding: '24' }),
      makeBlock('social', { showLabel: true, label: 'Follow for more launches' }),
      makeBlock('footer', { text: '© 2026 Your Store', showUnsubscribe: true }),
    ],
  },
];
