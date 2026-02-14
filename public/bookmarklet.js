/**
 * Design System Workbench -- Extraction Bookmarklet
 *
 * Walks all visible elements on the current page, extracts design properties
 * via getComputedStyle(), collects CSS custom properties from accessible
 * stylesheets, deduplicates, serializes as JSON, and copies to clipboard.
 *
 * To use as a bookmarklet, minify this file and prefix with `javascript:`.
 *
 * Output format:
 * {
 *   version: 1,
 *   url: string,
 *   timestamp: string,
 *   colors: string[],
 *   fontFamilies: string[],
 *   fontSizes: string[],
 *   spacings: string[],
 *   shadows: string[],
 *   customProperties: Record<string, string>,
 *   transitions: string[]
 * }
 */
(function () {
  'use strict';

  // Tags to skip
  var SKIP = {
    SCRIPT: 1, STYLE: 1, META: 1, LINK: 1, HEAD: 1, TITLE: 1,
    NOSCRIPT: 1, BR: 1, HR: 1, WBR: 1, BASE: 1, SVG: 1
  };

  var colors = {};
  var fontFamilies = {};
  var fontSizes = {};
  var spacings = {};
  var shadows = {};
  var transitions = {};
  var customProperties = {};

  // Helper to add to a dedup set (object used as set for speed)
  function add(set, value) {
    if (value && value !== 'none' && value !== 'normal' && value !== 'initial' &&
        value !== 'inherit' && value !== '0px' && value !== '0s' &&
        value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
      set[value] = 1;
    }
  }

  // Walk all elements
  var all = document.querySelectorAll('*');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    if (SKIP[el.tagName]) continue;

    var s;
    try {
      s = window.getComputedStyle(el);
    } catch (e) {
      continue;
    }

    // Colors
    add(colors, s.color);
    add(colors, s.backgroundColor);
    add(colors, s.borderTopColor);
    add(colors, s.borderRightColor);
    add(colors, s.borderBottomColor);
    add(colors, s.borderLeftColor);
    add(colors, s.outlineColor);

    // Font
    add(fontFamilies, s.fontFamily);
    add(fontSizes, s.fontSize);

    // Spacing (only add non-zero values)
    var spacingProps = [
      s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft,
      s.marginTop, s.marginRight, s.marginBottom, s.marginLeft,
      s.rowGap, s.columnGap
    ];
    for (var j = 0; j < spacingProps.length; j++) {
      add(spacings, spacingProps[j]);
    }

    // Box shadow
    add(shadows, s.boxShadow);

    // Transition
    var td = s.transitionDuration;
    var ttf = s.transitionTimingFunction;
    if (td && td !== '0s') {
      // Combine duration and timing function into a transition string
      var durations = td.split(', ');
      var timings = ttf ? ttf.split(', ') : [];
      for (var k = 0; k < durations.length; k++) {
        var dur = durations[k];
        var timing = timings[k] || timings[0] || 'ease';
        var combo = dur + ' ' + timing;
        add(transitions, combo);
      }
    }
  }

  // Collect CSS custom properties from accessible stylesheets
  try {
    var sheets = document.styleSheets;
    for (var si = 0; si < sheets.length; si++) {
      try {
        var rules = sheets[si].cssRules || sheets[si].rules;
        if (!rules) continue;
        for (var ri = 0; ri < rules.length; ri++) {
          var rule = rules[ri];
          if (rule.style) {
            for (var pi = 0; pi < rule.style.length; pi++) {
              var prop = rule.style[pi];
              if (prop.indexOf('--') === 0) {
                customProperties[prop] = rule.style.getPropertyValue(prop).trim();
              }
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheet -- skip
      }
    }
  } catch (e) {
    // No stylesheet access
  }

  // Build output
  var output = {
    version: 1,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    colors: Object.keys(colors),
    fontFamilies: Object.keys(fontFamilies),
    fontSizes: Object.keys(fontSizes),
    spacings: Object.keys(spacings),
    shadows: Object.keys(shadows),
    customProperties: customProperties,
    transitions: Object.keys(transitions)
  };

  var json = JSON.stringify(output, null, 2);

  // Copy to clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(json).then(function () {
      alert('Design tokens extracted! (' +
        output.colors.length + ' colors, ' +
        output.fontFamilies.length + ' fonts, ' +
        output.fontSizes.length + ' sizes, ' +
        output.spacings.length + ' spacings, ' +
        output.shadows.length + ' shadows, ' +
        Object.keys(output.customProperties).length + ' custom properties)\n\n' +
        'Paste into the Reverse Map tool to import.');
    }).catch(function () {
      // Fallback: prompt with the JSON
      prompt('Could not copy to clipboard. Copy this JSON manually:', json);
    });
  } else {
    // Fallback for older browsers
    prompt('Copy this JSON and paste into the Reverse Map tool:', json);
  }
})();
