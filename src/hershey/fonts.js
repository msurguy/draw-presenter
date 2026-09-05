import { publicUrl } from "../deck/publicUrl.js";

// Single-line (stroke) font registry. Fonts are SVG 1.1 fonts bundled in
// public/fonts/single-line/ (licenses: see THIRD_PARTY_NOTICES.md). Each
// glyph's `d` is an open, unfilled polyline — one `M …` subpath per pen
// stroke. Use the same key rules when adding fonts: filename stem,
// non-alphanumerics dropped, CamelCase.
export const FONTS = {
  // Hershey
  HersheyAstrology: "Hershey/HersheyAstrology.svg",
  HersheyCyrillic: "Hershey/HersheyCyrillic.svg",
  HersheyGothEnglish: "Hershey/HersheyGothEnglish.svg",
  HersheyGothGerman: "Hershey/HersheyGothGerman.svg",
  HersheyGothItalian: "Hershey/HersheyGothItalian.svg",
  HersheyGreek1Stroke: "Hershey/HersheyGreek1stroke.svg",
  HersheyGreekMedium: "Hershey/HersheyGreekmedium.svg",
  HersheyJapanese: "Hershey/HersheyJapanese.svg",
  HersheyMarkers: "Hershey/HersheyMarkers.svg",
  HersheyMathLower: "Hershey/HersheyMath(lower).svg",
  HersheyMathUpper: "Hershey/HersheyMath(upper).svg",
  HersheyMeteorology: "Hershey/HersheyMeteorology.svg",
  HersheyMusic: "Hershey/HersheyMusic.svg",
  HersheySans1: "Hershey/HersheySans1.svg",
  HersheySansMed: "Hershey/HersheySansMed.svg",
  HersheySansBold: "Hershey/HersheySansbold.svg",
  HersheyScript1StrokeAlt: "Hershey/HersheyScript1-stroke(alt).svg",
  HersheyScript1: "Hershey/HersheyScript1.svg",
  HersheyScriptMed: "Hershey/HersheyScriptMed.svg",
  HersheySerifBold: "Hershey/HersheySerifBold.svg",
  HersheySerifBoldItalic: "Hershey/HersheySerifBoldItalic.svg",
  HersheySerifMed: "Hershey/HersheySerifMed.svg",
  HersheySerifMedItalic: "Hershey/HersheySerifMedItalic.svg",
  HersheySymbolic: "Hershey/HersheySymbolic.svg",
  // EMS
  EMSAllure: "EMS/EMSAllure.svg",
  EMSBird: "EMS/EMSBird.svg",
  EMSBirdSwashCaps: "EMS/EMSBirdSwashCaps.svg",
  EMSBrush: "EMS/EMSBrush.svg",
  EMSCapitol: "EMS/EMSCapitol.svg",
  EMSCasualHand: "EMS/EMSCasualHand.svg",
  EMSDecorousScript: "EMS/EMSDecorousScript.svg",
  EMSDelight: "EMS/EMSDelight.svg",
  EMSDelightSwashCaps: "EMS/EMSDelightSwashCaps.svg",
  EMSElfin: "EMS/EMSElfin.svg",
  EMSFelix: "EMS/EMSFelix.svg",
  EMSHerculean: "EMS/EMSHerculean.svg",
  EMSInvite: "EMS/EMSInvite.svg",
  EMSLeague: "EMS/EMSLeague.svg",
  EMSLittlePrincess: "EMS/EMSLittlePrincess.svg",
  EMSMistyNight: "EMS/EMSMistyNight.svg",
  EMSNeato: "EMS/EMSNeato.svg",
  EMSNixish: "EMS/EMSNixish.svg",
  EMSNixishItalic: "EMS/EMSNixishItalic.svg",
  EMSOsmotron: "EMS/EMSOsmotron.svg",
  EMSPancakes: "EMS/EMSPancakes.svg",
  EMSPepita: "EMS/EMSPepita.svg",
  EMSQwandry: "EMS/EMSQwandry.svg",
  EMSReadability: "EMS/EMSReadability.svg",
  EMSReadabilityItalic: "EMS/EMSReadabilityItalic.svg",
  EMSSociety: "EMS/EMSSociety.svg",
  EMSSpaceRocks: "EMS/EMSSpaceRocks.svg",
  EMSSwiss: "EMS/EMSSwiss.svg",
  EMSTech: "EMS/EMSTech.svg",
  // Cutlings
  CutlingsDualis: "Cutlings/CutlingsDualis.svg",
  CutlingsGeometric: "Cutlings/CutlingsGeometric.svg",
  CutlingsGeometricRound: "Cutlings/CutlingsGeometricRound.svg",
  CutlingsPluralis: "Cutlings/CutlingsPluralis.svg",
  CutlingsSingularis: "Cutlings/CutlingsSingularis.svg",
  EMSAllureSmooth: "Cutlings/EMS_Allure_Smooth.svg",
  EMSElfinSmooth: "Cutlings/EMS_Elfin_Smooth.svg",
  HersheyScript1Smooth: "Cutlings/HersheyScript1smooth.svg",
  // Relief
  ReliefSingleLine: "Relief/ReliefSingleLine-Regular.svg",
  ReliefSingleLineOrnament: "Relief/ReliefSingleLineOrnament-Regular.svg",
  // Shriinivas
  ShriinivasScript: "Shriinivas/Custom-Script.svg",
  ShriinivasSquareItalic: "Shriinivas/Custom-SquareItalic.svg",
  ShriinivasSquareNormal: "Shriinivas/Custom-SquareNormal.svg",
  // Other
  RoutedGothic: "RoutedGothic.svg",
};

/** Font families for grouped pickers (order = display order). */
export const FONT_GROUPS = [
  { label: "Hershey", fonts: ["HersheyAstrology", "HersheyCyrillic", "HersheyGothEnglish", "HersheyGothGerman", "HersheyGothItalian", "HersheyGreek1Stroke", "HersheyGreekMedium", "HersheyJapanese", "HersheyMarkers", "HersheyMathLower", "HersheyMathUpper", "HersheyMeteorology", "HersheyMusic", "HersheySans1", "HersheySansMed", "HersheySansBold", "HersheyScript1StrokeAlt", "HersheyScript1", "HersheyScriptMed", "HersheySerifBold", "HersheySerifBoldItalic", "HersheySerifMed", "HersheySerifMedItalic", "HersheySymbolic"] },
  { label: "EMS", fonts: ["EMSAllure", "EMSBird", "EMSBirdSwashCaps", "EMSBrush", "EMSCapitol", "EMSCasualHand", "EMSDecorousScript", "EMSDelight", "EMSDelightSwashCaps", "EMSElfin", "EMSFelix", "EMSHerculean", "EMSInvite", "EMSLeague", "EMSLittlePrincess", "EMSMistyNight", "EMSNeato", "EMSNixish", "EMSNixishItalic", "EMSOsmotron", "EMSPancakes", "EMSPepita", "EMSQwandry", "EMSReadability", "EMSReadabilityItalic", "EMSSociety", "EMSSpaceRocks", "EMSSwiss", "EMSTech"] },
  { label: "Cutlings", fonts: ["CutlingsDualis", "CutlingsGeometric", "CutlingsGeometricRound", "CutlingsPluralis", "CutlingsSingularis", "EMSAllureSmooth", "EMSElfinSmooth", "HersheyScript1Smooth"] },
  { label: "Relief", fonts: ["ReliefSingleLine", "ReliefSingleLineOrnament"] },
  { label: "Shriinivas", fonts: ["ShriinivasScript", "ShriinivasSquareItalic", "ShriinivasSquareNormal"] },
  { label: "Other", fonts: ["RoutedGothic"] },
];

export const DEFAULT_FONT = "HersheySans1";

export function fontFileUrl(name) {
  const file = FONTS[name];
  if (!file) {
    console.warn(`[hershey] unknown font "${name}" — using ${DEFAULT_FONT}.`);
    return publicUrl(`/fonts/single-line/${FONTS[DEFAULT_FONT]}`);
  }
  return publicUrl(`/fonts/single-line/${file}`);
}
