import { toast } from "sonner"

export const useToast = () => {
  return {
    toast: (message: string, options?: { type?: 'success' | 'error' | 'info' }) => {
      if (options?.type === 'success') {
        toast.success(message)
      } else if (options?.type === 'error') {
        toast.error(message)
      } else {
        toast(message)
      }
    },
  }
}
