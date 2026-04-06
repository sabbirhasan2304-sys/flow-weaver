/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}><Text style={logoText}>⚡ BiztoriBD</Text></Section>
        <Heading style={h1}>You've been invited! 🚀</Heading>
        <Text style={text}>You've been invited to join <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>. Click the button below to accept.</Text>
        <Section style={buttonSection}><Button style={button} href={confirmationUrl}>Accept Invitation</Button></Section>
        <Text style={footer}>If you weren't expecting this, you can safely ignore this email.</Text>
      </Container>
    </Body>
  </Html>
)
export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(205, 100%, 50%)', margin: '0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 10%)', margin: '0 0 16px' }
const text = { fontSize: '15px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: 'hsl(205, 100%, 50%)', textDecoration: 'underline' }
const buttonSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = { backgroundColor: 'hsl(205, 100%, 50%)', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '10px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', borderTop: '1px solid #eee', paddingTop: '16px' }
