import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Key } from 'lucide-react';
import { credentialTypeConfigs, getCredentialTypeConfig, CredentialField } from './CredentialFieldsConfig';
import {
  OpenAIIcon, AnthropicIcon, GoogleIcon, SlackIcon, DiscordIcon,
  TelegramIcon, GitHubIcon, StripeIcon, AWSIcon, SupabaseIcon,
  PostgresIcon, MongoDBIcon, SMTPIcon, SendGridIcon, TwilioIcon,
  HTTPIcon, BearerIcon, APIKeyIcon, OAuth2Icon
} from '@/components/icons/ServiceIcons';

const getServiceIcon = (type: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    openai: <OpenAIIcon className="h-4 w-4" />,
    anthropic: <AnthropicIcon className="h-4 w-4" />,
    google: <GoogleIcon className="h-4 w-4" />,
    slack: <SlackIcon className="h-4 w-4" />,
    discord: <DiscordIcon className="h-4 w-4" />,
    telegram: <TelegramIcon className="h-4 w-4" />,
    github: <GitHubIcon className="h-4 w-4" />,
    stripe: <StripeIcon className="h-4 w-4" />,
    aws: <AWSIcon className="h-4 w-4" />,
    supabase: <SupabaseIcon className="h-4 w-4" />,
    postgres: <PostgresIcon className="h-4 w-4" />,
    mongodb: <MongoDBIcon className="h-4 w-4" />,
    smtp: <SMTPIcon className="h-4 w-4" />,
    sendgrid: <SendGridIcon className="h-4 w-4" />,
    twilio: <TwilioIcon className="h-4 w-4" />,
    http: <HTTPIcon className="h-4 w-4" />,
    bearer: <BearerIcon className="h-4 w-4" />,
    apikey: <APIKeyIcon className="h-4 w-4" />,
    oauth2: <OAuth2Icon className="h-4 w-4" />,
  };
  return iconMap[type] || <Key className="h-4 w-4" />;
};

interface CredentialFormProps {
  name: string;
  type: string;
  settings: Record<string, unknown>;
  onNameChange: (name: string) => void;
  onTypeChange: (type: string) => void;
  onSettingsChange: (settings: Record<string, unknown>) => void;
  showTypeSelector?: boolean;
}

export function CredentialForm({
  name,
  type,
  settings,
  onNameChange,
  onTypeChange,
  onSettingsChange,
  showTypeSelector = true,
}: CredentialFormProps) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const config = getCredentialTypeConfig(type);

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const handleFieldChange = (fieldName: string, value: unknown) => {
    onSettingsChange({ ...settings, [fieldName]: value });
  };

  const renderField = (field: CredentialField) => {
    const value = settings[field.name] ?? '';

    if (field.type === 'select' && field.options) {
      return (
        <Select
          value={String(value) || undefined}
          onValueChange={(v) => handleFieldChange(field.name, v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.type === 'password') {
      return (
        <div className="relative">
          <Input
            type={showPasswords[field.name] ? 'text' : 'password'}
            value={String(value)}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => togglePasswordVisibility(field.name)}
          >
            {showPasswords[field.name] ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      );
    }

    return (
      <Input
        type={field.type === 'number' ? 'number' : 'text'}
        value={String(value)}
        onChange={(e) => handleFieldChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={field.placeholder}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Credential Name */}
      <div className="space-y-2">
        <Label htmlFor="cred-name">Credential Name</Label>
        <Input
          id="cred-name"
          placeholder="e.g., My Production API"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>

      {/* Type Selector */}
      {showTypeSelector && (
        <div className="space-y-2">
          <Label htmlFor="cred-type">Type</Label>
          <Select value={type} onValueChange={onTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select credential type" />
            </SelectTrigger>
            <SelectContent>
              {credentialTypeConfigs.map((cfg) => (
                <SelectItem key={cfg.value} value={cfg.value}>
                  <div className="flex items-center gap-2">
                    {getServiceIcon(cfg.value)}
                    <span>{cfg.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {config && (
            <p className="text-xs text-muted-foreground">{config.description}</p>
          )}
        </div>
      )}

      {/* Dynamic Fields based on Type */}
      {config && config.fields.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-border">
          <h4 className="text-sm font-medium text-foreground">Configuration</h4>
          {config.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              {renderField(field)}
              {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
