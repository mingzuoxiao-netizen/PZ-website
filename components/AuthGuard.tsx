import React from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Public-facing PZ pages intentionally have no client-side access password.
 *
 * The previous local password check shipped its verifier to every browser and
 * could not protect content or API data. A private site MUST instead use
 * authenticated edge/server access control (e.g. Cloudflare Access). Admin
 * routes remain protected by AdminGuard and server-side Worker authorization.
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => <>{children}</>;

export default AuthGuard;
