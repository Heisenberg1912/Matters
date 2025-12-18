import { Toaster } from "react-hot-toast";

export default function ToastViewport() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: "#0f0f0f",
          color: "#f5f5f5",
          border: "1px solid #1f1f1f",
          borderRadius: "16px"
        },
        duration: 3500
      }}
    />
  );
}
