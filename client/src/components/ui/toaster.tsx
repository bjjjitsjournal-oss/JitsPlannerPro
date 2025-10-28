import { useToast } from "../../hooks/use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2">
      {toasts.filter(toast => toast.open !== false).map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg max-w-sm relative cursor-pointer ${
            toast.variant === 'destructive' 
              ? 'bg-red-600 text-white' 
              : 'bg-green-600 text-white'
          }`}
          onClick={() => dismiss(toast.id)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismiss(toast.id);
            }}
            className="absolute top-2 right-2 text-white hover:text-gray-200 text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close notification"
          >
            ×
          </button>
          {toast.title && (
            <div className="font-semibold mb-1 pr-6">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm opacity-90 pr-6">{toast.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}