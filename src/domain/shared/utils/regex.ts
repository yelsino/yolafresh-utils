export const buildCommandRegex = (phrases: string[]) => {
  const escapedPhrases = phrases.map((phrase) =>
    phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const regexString = escapedPhrases.join("|");
  return new RegExp(regexString, "i");
};

export const regextCommand1 =
  /^(.+?)\s+((?:un cuarto|tres cuartos|cuarto|medio|media|una|uno|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+(?:\/\d+)?|\d+(?:\.\d+)?))\s*soles?\s*(?:y|con)?\s*((?:un cuarto|tres cuartos|cuarto|medio|media|una|uno|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+(?:\/\d+)?|\d+(?:\.\d+)?))?(?:\s*c[eé]ntimos?)?$/i;

export const regextCommand2 =
  /^(?!\d)(?!.*\b(?:sol(?:es)?|centimo(?:s)?)\b)(?!\s*(?:un\s?cuarto|tres\s?cuartos|cuarto|medio|media|una|uno|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+(?:\/\d+)?|\d+(?:\.\d+)?))(?!\s*(?:kilo(?:s)?|kilogramo(?:s)?|kg|gramo(?:s)?|g|unidad(?:es)?|unidades?|saco(?:s)?|sacos?|docena(?:s)?|docenas?))(.+?)\s+((?:un\s?cuarto|tres\s?cuartos|cuarto|medio|media|una|uno|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+(?:\/\d+)?|\d+(?:\.\d+)?))(?:\s+(kilo(?:s)?|kilogramo(?:s)?|kg|gramo(?:s)?|g|unidad(?:es)?|unidades?|saco(?:s)?|sacos?|docena(?:s)?|docenas?))?(?:\s+(?:y|con)\s+((?:un\s?cuarto|tres\s?cuartos|cuarto|medio|media|una|uno|un|\d+(?:\/\d+)?|\d+(?:\.\d+)?))(?:\s+(kilo(?:s)?|kilogramo(?:s)?|kg|gramo(?:s)?|g|unidad(?:es)?|unidades?|saco(?:s)?|sacos?|docena(?:s)?|docenas?))?)?$/i;

export const regexCommand2Reverse =
  /^((?:un cuarto|tres cuartos|cuarto|medio|media|una|uno|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+(?:\/\d+)?|\d+(?:\.\d+)?))\s*(kilos?|kilogramos?|kg|gramos?|g|unidades?|unidad|sacos?|saco|docenas?|docena)?(?:\s+(?:y|con)\s+((?:un cuarto|tres cuartos|cuarto|medio|media|una|uno|un|\d+(?:\/\d+)?|\d+(?:\.\d+)?))\s*(kilos?|kilogramos?|kg|gramos?|g|unidades?|unidad|sacos?|saco|docenas?|docena)?)?(?:\s*(?:de|del)\s+)?(.+)$/i;


export const regexProductoPrecio =
  /^(.*?)\s*(?:cuesta|a|en)?\s*(\d+|c[ée]ro|un[oa]?|d[óo]s|tr[ée]s|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|diecis(?:[ée]is|eis)|diecisiete|dieciocho|diecinueve|veinte|veinti(?:uno|d[óo]s|tr[ée]s|cuatro|cinco|seis|siete|ocho|nueve)|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien)\s*(?:sol(?:es)?)?\s*(?:\s*(?:con)?\s*(\d+|c[ée]ro|un[oa]?|d[óo]s|tr[ée]s|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|diecis(?:[ée]is|eis)|diecisiete|dieciocho|diecinueve|veinte|veinti(?:uno|d[óo]s|tr[ée]s|cuatro|cinco|seis|siete|ocho|nueve)|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien)\s*(?:c[ée]ntimo(?:s)?)?)?\s*$/i;
