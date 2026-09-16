import { OPERATOR } from "@/lib/legal";
import { LegalPage, Section, Bullets } from "@/components/legal";

export const metadata = {
  title: "Naudojimosi taisyklės",
  description: "digiduktas naudojimosi taisyklės pirkėjams ir pardavėjams.",
};

export default function TaisyklesPage() {
  return (
    <LegalPage
      title="Naudojimosi taisyklės"
      intro={
        <>
          Šios taisyklės nustato naudojimosi {OPERATOR.brand} ({OPERATOR.site})
          svetaine sąlygas. Kurdami paskyrą ar naudodamiesi svetaine, sutinkate su
          šiomis taisyklėmis. Prašome atidžiai perskaityti.
        </>
      }
    >
      <Section n={1} title="Sąvokos">
        <Bullets
          items={[
            <><strong>Svetainė</strong> — {OPERATOR.site} ir joje teikiamos paslaugos.</>,
            <><strong>Operatorius</strong> — {OPERATOR.legalName}, individualios veiklos pažyma Nr. {OPERATOR.activityNo}.</>,
            <><strong>Pardavėjas</strong> — naudotojas, keliantis ir parduodantis skaitmeninius produktus.</>,
            <><strong>Pirkėjas</strong> — naudotojas, įsigyjantis produktus.</>,
            <><strong>Produktas</strong> — skaitmeninis turinys (šablonai, presetai, e-knygos, kursai ir kt.).</>,
          ]}
        />
      </Section>

      <Section n={2} title="Operatoriaus vaidmuo">
        <p>
          Svetainė yra <strong>turgus (platforma)</strong>, jungianti pirkėjus ir
          pardavėjus. Operatorius nėra produktų autorius ar pardavėjas (išskyrus
          atvejus, kai aiškiai nurodyta kitaip). Pirkimo–pardavimo sutartis
          sudaroma tarp pirkėjo ir pardavėjo. Operatorius užtikrina platformos
          veikimą, apmokėjimų surinkimą ir produktų pristatymą.
        </p>
      </Section>

      <Section n={3} title="Paskyra">
        <Bullets
          items={[
            "Naudotis svetaine gali ne jaunesni nei 18 metų asmenys arba juridiniai asmenys.",
            "Registruodamiesi pateikite teisingus duomenis ir juos atnaujinkite.",
            "Atsakote už savo prisijungimo duomenų saugumą ir veiksmus savo paskyroje.",
            "Operatorius turi teisę sustabdyti ar panaikinti paskyrą, pažeidus šias taisykles.",
          ]}
        />
      </Section>

      <Section n={4} title="Pardavėjo įsipareigojimai">
        <Bullets
          items={[
            "Parduoti tik savo sukurtus arba turimas teises parduoti produktus.",
            "Nekelti turinio, pažeidžiančio autorių teises, prekių ženklus ar įstatymus.",
            "Pateikti teisingą produkto aprašymą; produktas turi atitikti aprašymą.",
            "Įkelti veikiantį failą ir užtikrinti jo prieinamumą pirkėjui.",
            "Prijungti išmokas (Stripe) ir pateikti reikiamus tapatybės duomenis.",
            "Vykdyti mokestines prievoles už gautas pajamas.",
          ]}
        />
        <p>
          Pardavėjas suteikia operatoriui neišimtinę licenciją rodyti produkto
          medžiagą (pavadinimą, aprašymą, viršelį) svetainėje ir rinkodaros
          tikslais. Produkto autorių teisės lieka pardavėjui.
        </p>
      </Section>

      <Section n={5} title="Draudžiamas turinys">
        <p>Draudžiama kelti ir parduoti, be kita ko:</p>
        <Bullets
          items={[
            "svetimą ar be leidimo platinamą turinį (autorių teisių pažeidimai);",
            "kenkėjišką programinę įrangą ar apgaulingą turinį;",
            "neteisėtą, įžeidžiantį, smurtinį ar pornografinį turinį;",
            "asmens duomenis be teisėto pagrindo;",
            "produktus, klaidinančius pirkėją dėl turinio ar vertės.",
          ]}
        />
      </Section>

      <Section n={6} title="Moderacija">
        <p>
          Nauji produktai gali būti tikrinami prieš paskelbimą. Patvirtintiems
          („Verified“) pardavėjams produktai gali būti skelbiami iš karto.
          Operatorius turi teisę atsisakyti skelbti, sustabdyti arba pašalinti
          produktą, pažeidžiantį taisykles.
        </p>
      </Section>

      <Section n={7} title="Kainos, apmokėjimai ir komisija">
        <Bullets
          items={[
            "Kainas nustato pardavėjas; jos nurodomos eurais.",
            "Apmokėjimus apdoroja Stripe. Operatorius nesaugo kortelių duomenų.",
            <>Nuo kiekvieno pardavimo operatorius taiko {OPERATOR.commissionPct}% komisiją; likusi suma pervedama pardavėjui.</>,
            "Išmokos pardavėjui vykdomos per Stripe į jo nurodytą sąskaitą.",
          ]}
        />
      </Section>

      <Section n={8} title="Produktų pristatymas">
        <p>
          Po sėkmingo apmokėjimo pirkėjas įgyja teisę atsisiųsti produktą per
          savo paskyrą (skiltis „Mano pirkiniai“) apsaugota nuoroda. Atsisiuntimo
          nuoroda gali būti laikina saugumo sumetimais.
        </p>
      </Section>

      <Section n={9} title="Grąžinimai">
        <p>
          Kadangi parduodamas skaitmeninis turinys, grąžinimams taikoma atskira{" "}
          <a className="text-brand hover:underline" href="/grazinimai">Grąžinimų tvarka</a>.
        </p>
      </Section>

      <Section n={10} title="Atsakomybės ribojimas">
        <p>
          Svetainė teikiama „tokia, kokia yra“. Operatorius neatsako už pardavėjų
          įkeltų produktų kokybę, teisėtumą ar tinkamumą konkrečiam tikslui, taip
          pat už netiesioginius nuostolius, kiek tai leidžia teisės aktai.
          Operatoriaus atsakomybė bet kuriuo atveju neviršija konkretaus sandorio
          sumos. Ši nuostata neriboja vartotojų teisių, garantuojamų imperatyvių
          teisės aktų.
        </p>
      </Section>

      <Section n={11} title="Taikoma teisė">
        <p>
          Taisyklėms taikoma Lietuvos Respublikos teisė. Ginčai sprendžiami
          derybomis, o nepavykus — Lietuvos Respublikos teismuose. Vartotojai taip
          pat gali kreiptis į Valstybinę vartotojų teisių apsaugos tarnybą
          (vvtat.lt) ar naudotis EGS platforma.
        </p>
      </Section>

      <Section n={12} title="Pakeitimai">
        <p>
          Operatorius gali keisti šias taisykles. Apie pakeitimus pranešama
          svetainėje. Toliau naudodamiesi svetaine, sutinkate su atnaujinta
          versija.
        </p>
      </Section>
    </LegalPage>
  );
}
