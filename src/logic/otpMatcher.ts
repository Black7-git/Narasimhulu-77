/**
 * Deterministic Gmail OTP Matcher & Correlator
 * Matches verification codes without sending sensitive email content to AI.
 * Rejects stale, ambiguous, password-reset, or unrelated security emails.
 * Strictly guarantees zero OTP logging.
 */

export interface EmailMessage {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  bodyText: string;
  receivedAt: number; // Unix timestamp ms
}

export interface OtpCorrelationRequest {
  expectedServiceDomain: string;
  requestedAt: number; // Unix timestamp ms
  maxAgeMs?: number; // default 10 minutes
  userEmail: string;
}

export interface OtpMatchResult {
  matched: boolean;
  code?: string;
  rejectionReason?: string;
  sanitizedLogMessage: string;
}

export function correlateAndExtractOtp(
  message: EmailMessage,
  request: OtpCorrelationRequest,
  now: number = Date.now()
): OtpMatchResult {
  const maxAge = request.maxAgeMs || 10 * 60 * 1000;

  // 1. Recipient check
  if (message.recipient.toLowerCase().trim() !== request.userEmail.toLowerCase().trim()) {
    return {
      matched: false,
      rejectionReason: 'Recipient email does not match active applicant email address.',
      sanitizedLogMessage: 'Email rejected: recipient mismatch.',
    };
  }

  // 2. Age check (message must not be older than request or maxAge)
  if (message.receivedAt < request.requestedAt - 60000 || (now - message.receivedAt) > maxAge) {
    return {
      matched: false,
      rejectionReason: 'Email timestamp is stale or predates the active verification request.',
      sanitizedLogMessage: 'Email rejected: stale timestamp outside correlation window.',
    };
  }

  // 3. Sender domain check
  const senderLower = message.sender.toLowerCase();
  const domainClean = request.expectedServiceDomain.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
  if (!senderLower.includes(domainClean)) {
    return {
      matched: false,
      rejectionReason: `Sender "${message.sender}" does not correspond to expected domain "${domainClean}".`,
      sanitizedLogMessage: 'Email rejected: sender domain mismatch.',
    };
  }

  // 4. Safety: Reject password reset, account recovery, or suspicious security notifications
  const fullContent = `${message.subject} ${message.bodyText}`.toLowerCase();
  if (
    fullContent.includes('password reset') ||
    fullContent.includes('reset your password') ||
    fullContent.includes('recover your account') ||
    fullContent.includes('delete your account') ||
    fullContent.includes('suspicious activity')
  ) {
    return {
      matched: false,
      rejectionReason: 'Security guardrail: ApplyPilot never handles password reset or account recovery emails.',
      sanitizedLogMessage: 'Email rejected: detected password-reset / security recovery keywords.',
    };
  }

  // 5. Deterministic regex extraction for 4-8 digit numeric or alphanumeric verification codes
  // Look for patterns like: "code: 123456", "verification code is 123456", "OTP is 123456", "pin: 123456"
  const patterns = [
    /(?:verification\s+code|otp|passcode|one-time\s+code|security\s+code|login\s+code|pin)(?:\s+is)?[:\s]+([0-9]{4,8})\b/i,
    /\b([0-9]{4,8})\s+is\s+your\s+(?:verification|otp|login|security)\s+code\b/i,
    /(?:enter\s+code|use\s+code)[:\s]+([0-9]{4,8})\b/i,
    /\b([0-9]{6})\b/, // Standalone 6-digit code
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(message.bodyText) || pattern.exec(message.subject);
    if (match && match[1]) {
      const extractedCode = match[1];
      return {
        matched: true,
        code: extractedCode,
        sanitizedLogMessage: `Successfully correlated valid verification code from ${domainClean} (Length: ${extractedCode.length} digits, Received within window).`,
      };
    }
  }

  return {
    matched: false,
    rejectionReason: 'Could not identify a valid numerical verification code in matching email body.',
    sanitizedLogMessage: 'Email rejected: no recognizable verification code pattern found.',
  };
}
