import { OPERATOR } from "@/lib/legal";
import { BONUS_EUR, BONUS_SALES, BONUS_SELLERS, FOUNDING_LIMIT, FOUNDING_UNTIL_LABEL } from "@/lib/founding";
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
            "Prieš įkeliant produktą patvirtinti, kad turinys yra savo sukurtas arba turima teisė jį parduoti (patvirtinimo laikas išsaugomas).",
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
            "vadovėlių, pratybų ar kitų leidinių kopijas (pvz. nuskenuotus puslapius);",
            "oficialiai skelbiamų egzaminų užduočių kopijas, pateikiamas kaip savo kūrinys (savi sprendimai ir paaiškinimai — leidžiami);",
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

      <Section n={7} id="pazeidimai" title="Pranešimai apie pažeidimus ir turinio pašalinimas">
        <p>
          Jei manote, kad produktas pažeidžia jūsų autorių teises ar kitaip pažeidžia šias
          taisykles, praneškite mums. Pranešti gali bet kas — ir paskyros neturintys asmenys.
        </p>
        <p className="font-medium text-ink">Kaip pranešti</p>
        <Bullets
          items={[
            <>produkto puslapyje paspauskite <strong>„Pranešti apie produktą“</strong> (reikia prisijungti), arba</>,
            <>
              rašykite{" "}
              <a className="text-brand hover:underline" href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.
            </>,
          ]}
        />
        <p>Pranešime nurodykite:</p>
        <Bullets
          items={[
            "nuorodą į produktą;",
            "kas pažeidžiama (pvz. jūsų kūrinys ir kur jis paskelbtas);",
            "įrodymą, kad teisės priklauso jums (jei taikoma);",
            "savo vardą ir kontaktus;",
            "patvirtinimą, kad pateikta informacija teisinga.",
          ]}
        />
        <p className="font-medium text-ink">Kas vyksta toliau</p>
        <Bullets
          items={[
            "Pranešimą peržiūrime per 3 darbo dienas.",
            "Jei pažeidimas akivaizdus, produktas iš karto sustabdomas (nebematomas turguje), kol pranešimas nagrinėjamas.",
            "Pardavėjas informuojamas apie pranešimą ir sprendimo priežastis; jis gali pateikti paaiškinimą ar prieštaravimą.",
            "Patvirtinus pažeidimą produktas pašalinamas, o pirkėjams pinigai grąžinami pagal Grąžinimų tvarką.",
            "Pakartotinai taisykles pažeidžiančių pardavėjų paskyros sustabdomos arba panaikinamos.",
          ]}
        />
        <p>Apie priimtą sprendimą informuojame ir pranešusį asmenį, ir pardavėją.</p>
      </Section>

      <Section n={8} title="Kainos, apmokėjimai ir komisija">
        <Bullets
          items={[
            "Kainas nustato pardavėjas; jos nurodomos eurais.",
            "Apmokėjimus apdoroja Stripe. Operatorius nesaugo kortelių duomenų.",
            <>Nuo kiekvieno pardavimo operatorius taiko {OPERATOR.commissionPct}% komisiją; likusi suma pervedama pardavėjui.</>,
            <>
              Pirmiesiems {FOUNDING_LIMIT} pardavėjų (vieta rezervuojama užsiregistravus kaip pardavėjui arba
              patvirtinus pardavėjo paraišką) komisija netaikoma iki {FOUNDING_UNTIL_LABEL}.
            </>,
            <>
              Pirmiesiems {BONUS_SELLERS} iš jų, pardavusiems savo produktus {BONUS_SALES} skirtingiems
              pirkėjams, operatorius vieną kartą išmoka {BONUS_EUR} € bonusą. Nustačius piktnaudžiavimą (pvz.
              pirkimus iš savo ar susijusių paskyrų) bonusas neišmokamas.
            </>,
            "Išmokos pardavėjui vykdomos per Stripe į jo nurodytą sąskaitą.",
          ]}
        />
      </Section>

      <Section n={9} title="Produktų pristatymas">
        <p>
          Po sėkmingo apmokėjimo pirkėjas įgyja teisę atsisiųsti produktą per
          savo paskyrą (skiltis „Mano pirkiniai“) apsaugota nuoroda. Atsisiuntimo
          nuoroda gali būti laikina saugumo sumetimais.
        </p>
      </Section>

      <Section n={10} title="Grąžinimai">
        <p>
          Kadangi parduodamas skaitmeninis turinys, grąžinimams taikoma atskira{" "}
          <a className="text-brand hover:underline" href="/grazinimai">Grąžinimų tvarka</a>.
        </p>
      </Section>

      <Section n={11} title="Atsakomybės ribojimas">
        <p>
          Svetainė teikiama „tokia, kokia yra“. Operatorius neatsako už pardavėjų
          įkeltų produktų kokybę, teisėtumą ar tinkamumą konkrečiam tikslui, taip
          pat už netiesioginius nuostolius, kiek tai leidžia teisės aktai.
          Operatoriaus atsakomybė bet kuriuo atveju neviršija konkretaus sandorio
          sumos. Ši nuostata neriboja vartotojų teisių, garantuojamų imperatyvių
          teisės aktų.
        </p>
      </Section>

      <Section n={12} title="Taikoma teisė">
        <p>
          Taisyklėms taikoma Lietuvos Respublikos teisė. Ginčai sprendžiami
          derybomis, o nepavykus — Lietuvos Respublikos teismuose. Vartotojai taip
          pat gali kreiptis į Valstybinę vartotojų teisių apsaugos tarnybą
          (vvtat.lt) ar naudotis EGS platforma.
        </p>
      </Section>

      <Section n={13} title="Pakeitimai">
        <p>
          Operatorius gali keisti šias taisykles. Apie pakeitimus pranešama
          svetainėje. Toliau naudodamiesi svetaine, sutinkate su atnaujinta
          versija.
        </p>
      </Section>
    </LegalPage>
  );
}
