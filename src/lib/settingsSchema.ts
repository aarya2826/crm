import { z } from "zod";

export const settingsFormSchema = z.object({
  instituteName: z.string().trim().min(1, "Institute name is required"),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "Enter a valid email",
    }),
  logoDataUrl: z.string().optional(),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
