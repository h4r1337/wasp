{{={= =}=}}
import { signData } from '../../jwt.js'
import { emailSender } from '../../../email/index.js';
import { Email } from '../../../email/core/types.js';
import {
  createProviderId,
  updateAuthIdentityProviderData,
  findAuthIdentity,
  deserializeAndSanitizeProviderData,
  type EmailProviderData,
} from '../../utils.js';
import waspServerConfig from '../../../config.js';
import { type {= userEntityUpper =}, type {= authEntityUpper =} } from '../../../entities/index.js'

export async function createEmailVerificationLink(
  email: string,
  clientRoute: string,
): Promise<string> {
  const { jwtToken } = await createEmailJwtToken(email);
  return `${waspServerConfig.frontendUrl}${clientRoute}?token=${jwtToken}`;
}

export async function createPasswordResetLink(
  email: string,
  clientRoute: string,
): Promise<string>  {
  const { jwtToken } = await createEmailJwtToken(email);
  return `${waspServerConfig.frontendUrl}${clientRoute}?token=${jwtToken}`;
}

async function createEmailJwtToken(email: string): Promise<{ jwtToken: string; }> {
  const jwtToken = await signData({ email }, { expiresIn: '30m' });
  return { jwtToken };
}

export async function sendPasswordResetEmail(
  email: string,
  content: Email,
): Promise<void> {
  return sendEmailAndSaveMetadata(email, content, {
    passwordResetSentAt: (new Date()).toISOString(),
  });
}

export async function sendEmailVerificationEmail(
  email: string,
  content: Email,
): Promise<void> {
  return sendEmailAndSaveMetadata(email, content, {
    emailVerificationSentAt: (new Date()).toISOString(),
  });
}

async function sendEmailAndSaveMetadata(
  email: string,
  content: Email,
  metadata: Partial<EmailProviderData>,
): Promise<void> {
  // Save the metadata (e.g. timestamp) first, and then send the email
  // so the user can't send multiple requests while the email is being sent.
  const providerId = createProviderId("email", email);
  const authIdentity = await findAuthIdentity(providerId);
  const providerData = deserializeAndSanitizeProviderData<'email'>(authIdentity.providerData);
  await updateAuthIdentityProviderData<'email'>(providerId, providerData, metadata);

  emailSender.send(content).catch((e) => {
    console.error('Failed to send email', e);
  });
}

export function isEmailResendAllowed<Field extends 'emailVerificationSentAt' | 'passwordResetSentAt'>(
  fields: {
    [field in Field]: string | null
  },
  field: Field,
  resendInterval: number = 1000 * 60,
): {
  isResendAllowed: boolean;
  timeLeft: number;
} {
  const sentAt = fields[field];
  if (!sentAt) {
    return {
      isResendAllowed: true,
      timeLeft: 0,
    };
  }
  const now = new Date();
  const diff = now.getTime() - new Date(sentAt).getTime();
  const isResendAllowed = diff > resendInterval;
  // Time left in seconds
  const timeLeft = isResendAllowed ? 0 : Math.round((resendInterval - diff) / 1000);
  return { isResendAllowed, timeLeft };
}
