// „Founding" pardavėjų pasiūlymas. Be serverio importų — naudojama ir puslapiuose.

export const FOUNDING_LIMIT = 20;
/** Iki kada founding pardavėjams netaikoma komisija (imtinai, Vilniaus laiku). */
export const FOUNDING_UNTIL = new Date("2026-12-31T23:59:59+02:00");
export const FOUNDING_UNTIL_LABEL = "2026 m. gruodžio 31 d.";

/** Bonusas: pirmiems N founding pardavėjų už pirmus pardavimus skirtingiems pirkėjams. */
export const BONUS_SELLERS = 10;
export const BONUS_SALES = 3;
export const BONUS_EUR = 5;

export function foundingActive(now: Date = new Date()) {
  return now <= FOUNDING_UNTIL;
}

export function foundingRemaining(taken: number) {
  return Math.max(0, FOUNDING_LIMIT - taken);
}

export const FOUNDING_OFFER = `Pirmiems ${FOUNDING_LIMIT} pardavėjų — 0 % komisijos iki ${FOUNDING_UNTIL_LABEL}`;
export const BONUS_OFFER = `Pirmieji ${BONUS_SELLERS} pardavėjų gauna ${BONUS_EUR} € bonusą už pirmus ${BONUS_SALES} pardavimus skirtingiems pirkėjams.`;
