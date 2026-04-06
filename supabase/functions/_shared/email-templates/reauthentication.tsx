/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps { token: string }

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for BiztoriBD</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}><Text style={logoText}>⚡ BiztoriBD</Text></Section>
        <Heading style={h1}>Confirm your identity</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Section style={codeSection}><Text style={codeStyle}>{token}</Text></Section>
        <Text style={footer}>This code will expire shortly. If you didn't request this, you can safely ignore this email.</Text>
      </Container>
    </Body>
  </Html>
)
export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(205, 100%, 50%)', margin: '0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 10%)', margin: '0 0 16px' }
const text = { fontSize: '15px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 20px' }
const codeSection = { textAlign: 'center' as const, margin: '24px 0', padding: '16px', backgroundColor: '#f4f8ff', borderRadius: '10px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: 'hsl(205, 100%, 50%)', margin: '0', letterSpacing: '4px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', borderTop: '1px solid #eee', paddingTop: '16px' }
