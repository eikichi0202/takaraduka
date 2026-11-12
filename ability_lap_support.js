(function (root) {
  'use strict';
  const clamp = (x, low, high) => Math.max(low, Math.min(high, x));
  const finite = value => {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  // These are deliberately modest candidate strengths, pending independent
  // out-of-time calibration. Both measures can overlap with the user's grade.
  function abilityEvidence({ h7, h9, historyN, debut }) {
    const h7Value = finite(h7), h9Value = finite(h9);
    const n = finite(historyN) || 0;
    const h7Point = !debut && h7Value !== null && h7Value >= 95 && h7Value <= 150
      ? clamp((h7Value - 95) / 25, 0, 1) * 0.8 : 0;
    const h9Point = h9Value !== null && h9Value > 85 && n >= 2
      ? clamp((h9Value - 85) / 15, 0, 1) * 0.85 * n / (n + 2) : 0;
    const total = Math.min(1.15, Math.max(h7Point, h9Point) + 0.35 * Math.min(h7Point, h9Point));
    return { h7: h7Point, h9: h9Point, total };
  }

  function lapFinishMix(predicted, rates) {
    if (!predicted || !rates) return 0;
    return ['instant', 'sustained', 'exhaustion'].reduce((sum, name, index) => {
      const value = Number(predicted[name]) || 0;
      return sum + value * (Number(rates[['kick', 'even', 'fade'][index]]) || 0);
    }, 0);
  }

  // Provisional local-course correction. The October-November 2026 evaluation
  // underpredicted high pace in both venues; the small shift is not calibrated
  // to horse win/place outcomes and must be rechecked on later races.
  function regionalPaceAdjustment(p, venue) {
    if (!['新潟', '福島'].includes(venue)) return { ...p };
    const shift = Math.min(0.04, Math.max(0, Number(p.s) - 0.03));
    return { h: p.h + shift, m: p.m, s: p.s - shift };
  }

  const api = { abilityEvidence, lapFinishMix, regionalPaceAdjustment };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ABILITY_LAP_SUPPORT = api;
})(typeof window !== 'undefined' ? window : globalThis);
