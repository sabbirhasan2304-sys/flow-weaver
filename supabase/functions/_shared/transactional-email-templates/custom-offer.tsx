/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BiztoriBD"

interface CustomOfferProps { name?: string; offerTitle?: string; offerDescription?: string; validUntil?: string }

const CustomOfferEmail = ({ name, offerTitle, offerDescription, validUntil }: CustomOfferProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{offerTitle || 'Special offer'} from {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}><Text style={logoText}>⚡ BiztoriBD</Text></Section>
        <Heading style={h1}>{name ? `${name}, you've received a special offer!` : 'You have a special offer!'} 🎁</Heading>
        {offerTitle && <Text style={offerTitleStyle}>{offerTitle}</Text>}
        <Text style={text}>{offerDescription || 'We have prepared a custom offer just for you. Click below to activate it.'}</Text>
        {validUntil && <Text style={text}><strong>Valid until:</strong> {validUntil}</Text>}
        <Section style={buttonSection}><Button style={button} href="https://biztoribd.com/billing">Activate Offer</Button></Section>
        <Text style={footer}>This offer was created specifically for you by the BiztoriBD team.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CustomOfferEmail,
  subject: (data: Record<string, any>) => `${data.offerTitle || 'Special offer'} — BiztoriBD`,
  displayName: 'Custom offer',
  previewData: { name: 'Rahim', offerTitle: 'Pro Bundle — 50% Off First 3 Months', offerDescription: 'Get access to all workflow automation and tracking features at half price for your first 3 months.', validUntil: '2026-05-01' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(205, 100%, 50%)', margin: '0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 10%)', margin: '0 0 16px' }
const offerTitleStyle = { fontSize: '18px', fontWeight: 'bold' as const, color: 'hsl(205, 100%, 50%)', margin: '0 0 12px', padding: '12px 16px', backgroundColor: '#f0f8ff', borderRadius: '8px', textAlign: 'center' as const }
const text = { fontSize: '15px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 20px' }
const buttonSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = { backgroundColor: 'hsl(205, 100%, 50%)', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '10px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', borderTop: '1px solid #eee', paddingTop: '16px' }
