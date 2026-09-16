import { OPERATOR } from "@/lib/legal";
import { LegalPage, Section, Bullets } from "@/components/legal";

export const metadata = {
  title: "Grąžinimų tvarka",
  description: "digiduktas grąžinimų ir pinigų grąžinimo sąlygos skaitmeniniams produktams.",
};

export default function GrazinimaiPage() {
  return (
    <LegalPage
      title="Grąžinimų tvarka"
      intro={
        <>
          Ši tvarka paaiškina, kada ir kaip galima susigrąžinti pinigus už {OPERATOR.site}{" "}
          įsigytus skaitmeninius produktus. Prašome perskaityti prieš pirkdami.
        </>
      }
    >
      <Section n={1} title="Skaitmeninio turinio ypatumas">
        <p>
          Svetainėje parduodamas skaitmeninis turinys (atsisiunčiami failai),
          kuris pristatomas iš karto po apmokėjimo. Pagal Lietuvos Respublikos
          civilinį kodeksą ir ES vartotojų teisių direktyvą,{" "}
          <strong>
            14 dienų atsisakymo teisė netaikoma skaitmeniniam turiniui, kuris buvo
            pradėtas teikti (atsisiųstas) gavus išankstinį jūsų sutikimą ir
            patvirtinimą, kad taip prarandate atsisakymo teisę
          </strong>
          . Pirkdami produktą ir jį atsisiųsdami, tokį sutikimą duodate.
        </p>
      </Section>

      <Section n={2} title="Kada pinigus grąžiname">
        <p>
          Nepaisant to, siekiame sąžiningumo. Pinigus galime grąžinti (visiškai
          arba iš dalies), jei:
        </p>
        <Bullets
          items={[
            "produktas iš esmės neatitinka aprašymo;",
            "failas sugadintas, neatsidaro arba jo nepavyksta atsisiųsti dėl techninės klaidos;",
            "produktas neveikia taip, kaip nurodyta, ir pardavėjas problemos neišsprendžia;",
            "produktas yra svetimas / pažeidžia autorių teises (sukčiavimas).",
          ]}
        />
      </Section>

      <Section n={3} title="Kada pinigų negrąžiname">
        <Bullets
          items={[
            "produktas atitinka aprašymą, bet tiesiog jums nepatiko ar netiko;",
            "persigalvojote jau atsisiuntę veikiantį failą;",
            "neturite tinkamos programinės įrangos produktui atidaryti (jei reikalavimai buvo nurodyti);",
            "problema kyla dėl netinkamo naudojimo.",
          ]}
        />
      </Section>

      <Section n={4} title="Kaip pateikti prašymą">
        <p>
          Pastebėję problemą, kreipkitės per 14 dienų nuo pirkimo:
        </p>
        <Bullets
          items={[
            <>naudokite mygtuką <strong>„Pranešti“</strong> produkto puslapyje, arba</>,
            <>rašykite <a className="text-brand hover:underline" href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a> nurodydami pirkimo datą, produktą ir problemą (pageidautina su ekrano nuotrauka).</>,
          ]}
        />
      </Section>

      <Section n={5} title="Nagrinėjimas ir grąžinimas">
        <p>
          Prašymą išnagrinėjame per protingą terminą (paprastai iki 14 dienų).
          Patenkinus prašymą, pinigai grąžinami tuo pačiu mokėjimo būdu, kuriuo
          buvo apmokėta, per Stripe. Grąžinus pinigus, teisė naudoti produktą
          panaikinama.
        </p>
      </Section>

      <Section n={6} title="Pardavėjų ir platformos vaidmuo">
        <p>
          Kadangi {OPERATOR.brand} yra turgus, sprendimai dėl grąžinimų priimami
          bendradarbiaujant su pardavėju. Operatorius tarpininkauja ginčuose ir
          gali priimti galutinį sprendimą, siekdamas sąžiningo rezultato bei
          apsaugoti nuo sukčiavimo.
        </p>
      </Section>

      <Section n={7} title="Kontaktai">
        <p>
          Visais klausimais dėl grąžinimų:{" "}
          <a className="text-brand hover:underline" href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
