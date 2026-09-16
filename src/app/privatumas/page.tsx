import { OPERATOR } from "@/lib/legal";
import { LegalPage, Section, Bullets } from "@/components/legal";

export const metadata = {
  title: "Privatumo politika",
  description: "Kaip digiduktas renka, naudoja ir saugo jūsų asmens duomenis.",
};

export default function PrivatumasPage() {
  return (
    <LegalPage
      title="Privatumo politika"
      intro={
        <>
          Ši privatumo politika paaiškina, kaip {OPERATOR.brand} ({OPERATOR.site})
          renka, naudoja ir saugo jūsų asmens duomenis, kai naudojatės mūsų
          svetaine. Gerbiame jūsų privatumą ir tvarkome duomenis pagal Bendrąjį
          duomenų apsaugos reglamentą (BDAR) ir Lietuvos Respublikos teisės aktus.
        </>
      }
    >
      <Section n={1} title="Duomenų valdytojas">
        <p>
          Svetainę valdo ir jūsų asmens duomenis tvarko:
        </p>
        <Bullets
          items={[
            <>Vardas: {OPERATOR.legalName}</>,
            <>Individualios veiklos pažymos Nr.: {OPERATOR.activityNo}</>,
            <>El. paštas: <a className="text-brand hover:underline" href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a></>,
          ]}
        />
        <p>Visais klausimais dėl asmens duomenų galite kreiptis nurodytu el. paštu.</p>
      </Section>

      <Section n={2} title="Kokius duomenis renkame">
        <p>Priklausomai nuo to, kaip naudojatės svetaine, galime tvarkyti:</p>
        <Bullets
          items={[
            <><strong>Paskyros duomenys:</strong> el. paštas, vardas (slapyvardis), profilio nuotrauka, aprašymas.</>,
            <><strong>Pardavėjo duomenys:</strong> paraiškos informacija, tapatybės ir banko duomenys (juos tvarko Stripe — žr. 4 skyrių).</>,
            <><strong>Pirkimų duomenys:</strong> įsigyti produktai, sumos, sandorių istorija.</>,
            <><strong>Turinys:</strong> jūsų įkelti produktai, aprašymai, atsiliepimai, pranešimai.</>,
            <><strong>Techniniai duomenys:</strong> IP adresas, naršyklės tipas, apytikslė statistika apie naudojimąsi svetaine.</>,
          ]}
        />
      </Section>

      <Section n={3} title="Kokiu tikslu ir pagrindu tvarkome">
        <Bullets
          items={[
            <><strong>Sutarties vykdymas:</strong> paskyros administravimas, pirkimų ir pardavimų vykdymas, produktų pristatymas.</>,
            <><strong>Teisinė prievolė:</strong> apskaitos ir mokesčių reikalavimai.</>,
            <><strong>Teisėtas interesas:</strong> svetainės saugumas, sukčiavimo prevencija, paslaugos gerinimas.</>,
            <><strong>Sutikimas:</strong> jei registruojatės į naujienlaiškį ar laukiančiųjų sąrašą — sutikimą galite atšaukti bet kada.</>,
          ]}
        />
      </Section>

      <Section n={4} title="Duomenų tvarkytojai (paslaugų teikėjai)">
        <p>
          Patikimų paslaugų teikėjų padedami užtikriname svetainės veikimą. Jie
          tvarko duomenis mūsų vardu ir tik reikalinga apimtimi:
        </p>
        <Bullets
          items={[
            <><strong>Stripe</strong> (Airija/JAV) — mokėjimų apdorojimas ir pardavėjų tapatybės bei banko duomenų tvarkymas.</>,
            <><strong>Supabase</strong> — duomenų bazės ir failų saugojimas.</>,
            <><strong>Vercel</strong> — svetainės talpinimas ir anoniminė lankomumo statistika.</>,
            <><strong>Resend</strong> — el. laiškų (pvz. pirkimo patvirtinimų) siuntimas.</>,
          ]}
        />
        <p>
          Kai duomenys perduodami už ES/EEE ribų, tai vyksta taikant tinkamas
          apsaugos priemones (pvz. standartines sutarčių sąlygas).
        </p>
      </Section>

      <Section n={5} title="Kiek laiko saugome">
        <p>
          Duomenis saugome tol, kol turite aktyvią paskyrą, ir po jos uždarymo
          tiek, kiek reikia teisinėms prievolėms (pvz. apskaitos dokumentus —
          įstatymų nustatytą laikotarpį). Nebereikalingus duomenis saugiai
          ištriname.
        </p>
      </Section>

      <Section n={6} title="Jūsų teisės">
        <p>Pagal BDAR turite teisę:</p>
        <Bullets
          items={[
            "susipažinti su savo duomenimis;",
            "reikalauti ištaisyti netikslius duomenis;",
            "reikalauti ištrinti duomenis („teisė būti pamirštam“);",
            "apriboti ar nesutikti su duomenų tvarkymu;",
            "gauti savo duomenis perkeliamu formatu;",
            "atšaukti duotą sutikimą.",
          ]}
        />
        <p>
          Norėdami pasinaudoti teisėmis, rašykite{" "}
          <a className="text-brand hover:underline" href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.
          Taip pat turite teisę pateikti skundą Valstybinei duomenų apsaugos
          inspekcijai (VDAI, ada.lt).
        </p>
      </Section>

      <Section n={7} title="Slapukai">
        <p>
          Naudojame tik būtinuosius slapukus, reikalingus prisijungimui ir
          svetainės veikimui, bei anoniminę lankomumo statistiką. Nenaudojame
          reklaminių trečiųjų šalių slapukų.
        </p>
      </Section>

      <Section n={8} title="Pakeitimai">
        <p>
          Šią politiką galime atnaujinti. Apie esminius pakeitimus pranešime
          svetainėje arba el. paštu. Aktuali versija visada skelbiama šiame
          puslapyje.
        </p>
      </Section>
    </LegalPage>
  );
}
