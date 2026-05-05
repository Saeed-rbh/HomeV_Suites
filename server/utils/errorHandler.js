/**
 * Safe error response helper.
 * Logs the full error server-side, returns a sanitized message to the client.
 * Maps known Prisma error codes to friendly messages.
 */
const PRISMA_ERROR_MESSAGES = {
    P2002: 'A record with that value already exists.',
    P2025: 'Record not found.',
    P2003: 'Operation failed due to a related record constraint.',
    P2014: 'The provided data violates a required relation.',
};

const handleError = (res, error, context = 'unknown', statusCode = 500) => {
    console.error(`[${context}]`, error);
    const message = PRISMA_ERROR_MESSAGES[error?.code] || error?.message || 'An unexpected error occurred.';
    // Never expose Prisma internals (they start with "Invalid `prisma.")
    const safeMessage = message.startsWith('Invalid `prisma') ? 'An unexpected error occurred.' : message;
    res.status(statusCode).json({ success: false, error: safeMessage });
};

module.exports = { handleError };
