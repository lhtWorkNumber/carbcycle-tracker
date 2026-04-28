export function formatMacroLabel(value: number, label: string) {
  if (label === "Calories") {
    return `${value} kcal`;
  }

  return `${value} g`;
}
