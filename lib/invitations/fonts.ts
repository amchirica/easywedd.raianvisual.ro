export const CONTROLLED_FONTS = [
  "Cormorant Garamond",
  "Source Sans 3",
  "Playfair Display",
  "Lora",
  "Libre Baskerville",
] as const;

export type ControlledFont = (typeof CONTROLLED_FONTS)[number];

export function isControlledFont(value: string): value is ControlledFont {
  return (CONTROLLED_FONTS as readonly string[]).includes(value);
}
