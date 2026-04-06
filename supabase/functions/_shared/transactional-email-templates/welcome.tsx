/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "BiztoriBD"

interface WelcomeEmailProps { name?: string }

const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — let's automate your business!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}><Text style={logoText}>⚡ BiztoriBD</Text></Section>
        <Heading style={h1}>{name ? `Welcome, ${name}!` : 'Welcome to BiztoriBD!'} 🎉</Heading>
        <Text style={text}>Your account is ready. You now have access to powerful workflow automation, server-side tracking, and email marketing — all in one platform built for Bangladesh.</Text>
        <Text style={text}>Here's what you can do next:</Text>
        <Text style={text}>• Create your first automation workflow<br/>• Set up server-side tracking for your ads<br/>• Import your email contacts<br/>• Connect bKash, Nagad, or other local integrations</Text>
        <Section style={buttonSection}><Button style={button} href="https://biztoribd.com/dashboard">Go to Dashboard</Button></Section>
        <Text style={footer}>Best regards,<br/>The BiztoriBD Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to BiztoriBD — Your automation journey starts now!',
  displayName: 'Welcome email',
  previewData: { name: 'Rahim' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(205, 100%, 50%)', margin: '0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 10%)', margin: '0 0 16px' }
const text = { fontSize: '15px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 20px' }
const buttonSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = { backgroundColor: 'hsl(205, 100%, 50%)', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '10px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', borderTop: '1px solid #eee', paddingTop: '16px' }
