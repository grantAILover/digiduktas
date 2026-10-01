import AuthForm from "./AuthForm";

export const metadata = { title: "Prisijungti" };

// /auth — prisijungimas, /auth?registracija=1 — iškart registracijos forma.
// ?patvirtinta=1 / ?klaida=nuoroda — pranešimai po el. pašto patvirtinimo.
export default async function AuthPage({ searchParams }: PageProps<"/auth">) {
  const sp = await searchParams;
  const notice =
    sp.patvirtinta === "1" ? "El. paštas patvirtintas! Dabar prisijunkite." : undefined;
  const error =
    sp.klaida === "nuoroda"
      ? "Patvirtinimo nuoroda nebegalioja arba jau panaudota. Pabandykite prisijungti — jei nepavyks, užsiregistruokite iš naujo."
      : undefined;

  return (
    <AuthForm
      initialMode={sp.registracija === "1" ? "register" : "login"}
      initialNotice={notice}
      initialError={error}
    />
  );
}
