import { redirect } from "next/navigation";
import { getInstituteName } from "@/app/settings/actions";
import { LoginForm } from "@/components/Auth/LoginForm";
import { getSessionUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/");
  }

  const instituteName = await getInstituteName();

  return (
    <main className="app-canvas flex min-h-screen items-center justify-center px-4">
      <div className="surface-card w-full max-w-md p-8">
        <p className="caption font-medium text-brand-600">Institute CRM</p>
        <h1 className="page-title mt-2">{instituteName}</h1>
        <p className="body-text mt-1">Sign in to continue.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="caption mt-6">Default admin: admin@institute.com / Admin@123</p>
      </div>
    </main>
  );
}
