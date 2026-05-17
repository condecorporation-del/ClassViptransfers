import { EmailService } from './features/booking/services/email.service';
import { hasErrorCode } from './shared/lib/errors';
import { app, ensureAdminExists } from './app';

const PORT = process.env.PORT || 3001;

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[Server] Unhandled promise rejection (non-fatal):', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('[Server] Uncaught exception:', error?.message || error);
  if (hasErrorCode(error) && error.code === 'EADDRINUSE') {
    process.exit(1);
  }
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  await ensureAdminExists();

  const emailService = new EmailService();
  if (!emailService.isConfigured()) {
    return;
  }

  const testRecipient =
    process.env.EMAIL_TEST_TO ||
    process.env.COMPANY_BOOKINGS_EMAIL ||
    process.env.GMAIL_USER;

  if (!testRecipient) {
    console.warn('[Email] No EMAIL_TEST_TO / COMPANY_BOOKINGS_EMAIL / GMAIL_USER for startup test');
    return;
  }

  emailService
    .sendStartupTest(testRecipient)
    .then((result) => {
      if (result.success) {
        console.log('[Email] Startup test email sent to', testRecipient);
      } else {
        console.warn('[Email] Startup test failed:', result.error);
      }
    })
    .catch((error) => {
      console.warn('[Email] Startup test error (server unaffected):', error?.message || error);
    });
});

export default app;
