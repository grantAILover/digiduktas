import AuthForm from "./AuthForm";

export const metadata = { title: "Prisijungti" };

// /auth — prisijungimas, /auth?registracija=1 — iškart registracijos forma
export default async function AuthPage({ searchParams }: PageProps<"/auth">) {
  const sp = await searchParams;
  return <AuthForm initialMode={sp.registracija === "1" ? "register" : "login"} />;
}
