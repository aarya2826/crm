import type { AppRole } from "@/constants/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: AppRole;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
  }
}
