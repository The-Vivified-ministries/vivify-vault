// Merge this into your tailwind.config.ts under theme.extend.colors
// Colors pulled from the Vivify Vault PDF: magenta header bars, lavender/
// purple topic panels, gold accent dots, charcoal buttons on light cards.

const vaultColors = {
  vault: {
    magenta: "#9C2B6E", // header bars, primary CTA
    magentaDark: "#7A2158",
    lavender: "#B7A6D9", // topic-page backgrounds
    gold: "#F2C230", // accent dots, highlights
    charcoal: "#3F3F3F", // dark buttons
    cream: "#FBF9F6", // page background
    stone: "#E7E3ED", // card backgrounds
  },
};

module.exports = { vaultColors };
