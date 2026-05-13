"use client";

import * as React from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps
} from "./toast";

type ToastContent = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastProps["variant"];
};

type ToastContextValue = {
  toast: (content: Omit<ToastContent, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    // Safe fallback so code doesn't crash if provider missing
    return {
      toast: (c: Omit<ToastContent, "id">) => {
        if (typeof window !== "undefined") console.info("[toast]", c);
      }
    };
  }
  return ctx;
}

export function Toaster({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastContent[]>([]);

  const toast = React.useCallback((content: Omit<ToastContent, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, ...content }]);
  }, []);

  const dismiss = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastProvider swipeDirection="right">
        {children}
        {items.map((item) => (
          <Toast
            key={item.id}
            variant={item.variant}
            onOpenChange={(open) => {
              if (!open) dismiss(item.id);
            }}
          >
            <div className="grid gap-1">
              {item.title && <ToastTitle>{item.title}</ToastTitle>}
              {item.description && <ToastDescription>{item.description}</ToastDescription>}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}
