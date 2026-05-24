const parentheticalPattern = /\(([^()]{18,280})\)/g;

function looksLikeEntityList(content: string) {
  const commaCount = (content.match(/,/g) ?? []).length;

  return commaCount >= 2 || (commaCount >= 1 && /\b(or|and)\b/i.test(content));
}

function cleanWhitespace(text: string) {
  return text
    .replace(/\s+([?.!,])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\?/g, "?")
    .trim();
}

export function extractLongParentheticalEntityLists(text: string) {
  const matches = Array.from(text.matchAll(parentheticalPattern));
  const lists = matches
    .map((match) => match[1].trim())
    .filter(looksLikeEntityList);

  return Array.from(new Set(lists));
}

export function hasLongParentheticalEntityList(text: string) {
  return extractLongParentheticalEntityLists(text).length > 0;
}

export function stripLongParentheticalEntityLists(text: string) {
  return cleanWhitespace(
    text.replace(parentheticalPattern, (fullMatch, content: string) =>
      looksLikeEntityList(content) ? "" : fullMatch,
    ),
  );
}

export function appendEntityListsToResolutionRule(
  resolutionRule: string,
  entityLists: string[],
) {
  const missingLists = entityLists.filter(
    (list) => !resolutionRule.toLowerCase().includes(list.toLowerCase()),
  );

  if (missingLists.length === 0) {
    return resolutionRule;
  }

  const definitions = missingLists
    .map((list) => `Qualifying entities: ${list}.`)
    .join(" ");

  return `${resolutionRule.trim()} ${definitions}`;
}
