/// <reference types="vite/client" />

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

interface Window {
  google?: {
    accounts?: {
      id?: {
        initialize: (options: {
          client_id: string;
          callback: (response: { credential?: string }) => void;
          ux_mode?: string;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: {
            theme?: string;
            size?: string;
            text?: string;
            shape?: string;
            width?: number;
          }
        ) => void;
        prompt: () => void;
      };
    };
  };
  Razorpay?: new (options: {
    key: string;
    amount: number;
    currency: string;
    name?: string;
    description?: string;
    order_id: string;
    handler: (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => void;
    prefill?: { name?: string; email?: string; contact?: string };
    notes?: Record<string, string>;
    theme?: { color?: string };
  }) => { open: () => void };
}
