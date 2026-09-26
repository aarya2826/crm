import { toast } from "sonner";

export const notify = {
  success: (message: string): void => {
    toast.success(message, { duration: 3000 });
  },
  error: (message: string): void => {
    toast.error(message, { duration: 3000 });
  },
  info: (message: string): void => {
    toast(message, { duration: 3000 });
  },
};
