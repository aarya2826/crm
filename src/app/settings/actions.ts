"use server";

/** Institute profile used on the header and PDF receipts. */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActionRole } from "@/lib/session";
import { settingsFormSchema } from "@/lib/settingsSchema";
import type { SettingsFormValues } from "@/lib/settingsSchema";
import type { ActionResult } from "@/types/lead.types";

const SETTING_ID = "main";

export interface InstituteProfile {
  instituteName: string;
  address: string;
  phone: string;
  email: string;
  logoDataUrl: string;
}

export async function getInstituteName(): Promise<string> {
  const profile = await getInstituteSettings();
  return profile.instituteName;
}

export async function getInstituteSettings(): Promise<InstituteProfile> {
  try {
    const setting = await prisma.instituteSetting.upsert({
      where: { id: SETTING_ID },
      update: {},
      create: { id: SETTING_ID, instituteName: "Your Institute" },
    });
    return {
      instituteName: setting.instituteName,
      address: setting.address,
      phone: setting.phone,
      email: setting.email,
      logoDataUrl: setting.logoDataUrl,
    };
  } catch (error) {
    console.error("Failed to load institute name:", error);
    return {
      instituteName: "Your Institute",
      address: "",
      phone: "",
      email: "",
      logoDataUrl: "",
    };
  }
}

export async function updateInstituteName(
  values: SettingsFormValues
): Promise<ActionResult> {
  const access = await requireActionRole(["ADMIN"]);
  if (!access.ok) {
    return access;
  }

  try {
    const parsed = settingsFormSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, error: "Please fix the form errors and try again." };
    }

    await prisma.instituteSetting.upsert({
      where: { id: SETTING_ID },
      update: {
        instituteName: parsed.data.instituteName,
        address: parsed.data.address ?? "",
        phone: parsed.data.phone ?? "",
        email: parsed.data.email ?? "",
        logoDataUrl: parsed.data.logoDataUrl ?? "",
      },
      create: {
        id: SETTING_ID,
        instituteName: parsed.data.instituteName,
        address: parsed.data.address ?? "",
        phone: parsed.data.phone ?? "",
        email: parsed.data.email ?? "",
        logoDataUrl: parsed.data.logoDataUrl ?? "",
      },
    });
    revalidatePath("/settings");
    revalidatePath("/fees");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update settings:", error);
    return { success: false, error: "Could not save settings. Please try again." };
  }
}
