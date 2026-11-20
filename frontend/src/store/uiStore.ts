import { create } from "zustand";

export type ToastSeverity = "success" | "error";
export type Toast = { message: string; severity: ToastSeverity };

type UiState = {
  toast: Toast | null;
  notify: (message: string, severity: ToastSeverity) => void;
  dismiss: () => void;
};

// El timer del auto-dismiss vive fuera del estado: no es datos.
let timer: ReturnType<typeof setTimeout> | null = null;

const useUiStore = create<UiState>((set) => ({
  toast: null,

  notify: (message, severity) => {
    // Un toast nuevo reemplaza al visible y reinicia el auto-dismiss.
    if (timer) clearTimeout(timer);
    set({ toast: { message, severity } });
    timer = setTimeout(() => set({ toast: null }), 4000);
  },

  dismiss: () => {
    if (timer) clearTimeout(timer);
    set({ toast: null });
  },
}));

export default useUiStore;
