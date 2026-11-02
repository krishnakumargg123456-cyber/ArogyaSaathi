'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: {
            theme: 'outline';
            size: 'large';
            shape: 'rectangular';
            width: number;
            text: 'continue_with' | 'signin_with';
          }) => void;
        };
      };
    };
  }
}

interface GoogleIdentityButtonProps {
  onCredential: (credential: string) => void;
  text?: 'continue_with' | 'signin_with';
}

export function GoogleIdentityButton({
  onCredential,
  text = 'continue_with',
}: GoogleIdentityButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const buttonRef = useRef<HTMLDivElement>(null);
  const credentialHandler = useRef(onCredential);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    credentialHandler.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId || !scriptReady || !window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => credentialHandler.current(credential),
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      width: Math.min(buttonRef.current.clientWidth, 360),
      text,
    });
  }, [clientId, scriptReady, text]);

  if (!clientId) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Google sign-in setup required: configure NEXT_PUBLIC_GOOGLE_CLIENT_ID for the web app.
      </p>
    );
  }

  if (scriptFailed) {
    return (
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        Google sign-in could not load. Check your connection and try again.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setScriptFailed(true)}
      />
      <div ref={buttonRef} className="flex min-h-11 justify-center" />
    </>
  );
}
