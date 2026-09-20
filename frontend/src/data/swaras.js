// Just-intonation frequency ratios for the seven shuddha swaras,
// relative to Sa (= 1/1). Useful once pitchDetector.js needs to map a
// detected frequency to the nearest swara for a given tonic.
//
// These are the conventional just-intonation ratios used in Hindustani
// theory; swap in komal/tivra variants here as needed per raga later.
export const SWARA_RATIOS = {
  Sa: 1 / 1,
  Re: 9 / 8,
  Ga: 5 / 4,
  Ma: 4 / 3,
  Pa: 3 / 2,
  Dha: 5 / 3,
  Ni: 15 / 8,
};

export const SWARA_ORDER = ["Sa", "Re", "Ga", "Ma", "Pa", "Dha", "Ni"];
