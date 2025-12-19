import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const GOOGLE_SCRIPT_ID = 'google-identity-script';
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let googleScriptPromise: Promise<void> | null = null;

const loadGoogleScript = () => {
  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Google script failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google script failed to load'));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

type GoogleSignInButtonProps = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export default function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const { loginWithGoogle, isLoading } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const handleCredential = useCallback(
    async (response: { credential?: string }) => {
      if (!response?.credential) {
        const message = 'Google sign-in failed. Missing credential.';
        setError(message);
        onError?.(message);
        return;
      }

      try {
        await loginWithGoogle(response.credential, clientId);
        onSuccess?.();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Google sign-in failed.';
        setError(message);
        onError?.(message);
      }
    },
    [clientId, loginWithGoogle, onError, onSuccess]
  );

  useEffect(() => {
    let isActive = true;

    if (!clientId) {
      setError('Google client ID is not configured.');
      return () => undefined;
    }

    loadGoogleScript()
      .then(() => {
        if (!isActive || !window.google?.accounts?.id) {
          return;
        }

        if (!initializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredential,
            ux_mode: 'popup',
          });
          initializedRef.current = true;
        }

        if (buttonRef.current) {
          buttonRef.current.innerHTML = '';
          const width = buttonRef.current.offsetWidth || 320;
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width,
          });
          setReady(true);
        }
      })
      .catch((err) => {
        if (!isActive) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Google sign-in failed to load.';
        setError(message);
        onError?.(message);
      });

    return () => {
      isActive = false;
    };
  }, [clientId, handleCredential, onError]);

  return (
    <div className="space-y-2">
      <div ref={buttonRef} className={ready ? '' : 'hidden'} />
      {!ready && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-xl border-gray-300 text-gray-700"
          disabled
        >
          Google Sign-In unavailable
        </Button>
      )}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
