const RAZORPAY_SCRIPT_ID = 'razorpay-checkout-js';
const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let razorpayPromise: Promise<void> | null = null;

export const loadRazorpayScript = () => {
  if (razorpayPromise) {
    return razorpayPromise;
  }

  razorpayPromise = new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(RAZORPAY_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Razorpay script failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay script failed to load'));
    document.body.appendChild(script);
  });

  return razorpayPromise;
};
