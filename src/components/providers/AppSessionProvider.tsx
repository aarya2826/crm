"use client";

import type { FC, ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface AppSessionProviderProps {
  session: Session | null;
  children: ReactNode;
}

export const AppSessionProvider: FC<AppSessionProviderProps> = ({
  session,
  children,
}) => {
  return <SessionProvider session={session}>{children}</SessionProvider>;
};
