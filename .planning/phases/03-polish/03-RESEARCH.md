# Phase 3: Polish - Research

**Researched:** 2026-01-18
**Domain:** Output display, clipboard API, keyboard shortcuts, accessibility
**Confidence:** HIGH

## Summary

Phase 3 adds polish features: enhanced output display showing breakdown details, a copy/export summary feature using the Clipboard API, and keyboard-only data entry flow.

The Individual Shares section already exists with basic totals. Enhancement involves showing item breakdowns (collapsible or expanded) and providing a "Copy Summary" button. The Clipboard API (`navigator.clipboard.writeText()`) is Baseline Widely Available since March 2020 and works in all modern browsers with HTTPS.

**Keyboard focus (user clarification):** The goal is **keyboard-only data entry** - users should be able to enter all data without touching the mouse. This means:
- Seamless Tab flow through all inputs (diners → dishes → bill totals)
- Tab from last dish price auto-creates new dish row (already implemented in Phase 2)
- Enter key support for confirming/adding entries
- No Ctrl/Cmd modifier shortcuts needed - just natural tab/enter flow
- Mouse-only actions (delete buttons) are acceptable

**Primary recommendation:** Use inline button text change ("Copied!") for clipboard feedback rather than toast notifications. Focus on polishing the Tab flow rather than adding complex keyboard shortcuts.

## Standard Stack

### Core (Native Browser APIs)
| API | Purpose | Why Standard |
|-----|---------|--------------|
| `navigator.clipboard.writeText()` | Copy text to clipboard | Baseline Widely Available since 2020, Promise-based |
| `keydown` event | Keyboard shortcut detection | Standard DOM event, supported everywhere |
| `event.key` / `event.code` | Key identification | Modern API, replaces deprecated `keyCode` |
| `event.ctrlKey` / `event.metaKey` | Modifier detection | Built-in properties, handles Ctrl vs Cmd |

### Supporting
| Technique | Purpose | When to Use |
|-----------|---------|-------------|
| CSS `details/summary` | Collapsible sections | Native HTML, accessible by default |
| CSS `@keyframes` | "Copied!" animation | Inline feedback without toast library |
| `aria-keyshortcuts` | Announce shortcuts to screen readers | When implementing custom shortcuts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline "Copied!" text | Toast library | Toast adds dependency, accessibility issues |
| Native `details` | Custom accordion | More code, must handle accessibility |
| `?` for help modal | Keyboard shortcut cheatsheet page | Modal is faster, conventional |
| Ctrl/Cmd+key | `accesskey` attribute | `accesskey` has inconsistent browser support |

**Installation:** None required - all native browser APIs.

## Architecture Patterns

### Pattern 1: Clipboard Copy with Inline Feedback
**What:** Copy text to clipboard, show "Copied!" feedback inline on button
**When to use:** Copy actions in web apps
**Example:**
```typescript
// Source: MDN Clipboard API documentation
async function copyToClipboard(text: string, button: HTMLButtonElement): Promise<void> {
  const originalText = button.textContent;

  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied!";
    button.classList.add("copy-success");

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("copy-success");
    }, 2000);
  } catch (error) {
    // Fallback or error feedback
    button.textContent = "Failed";
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  }
}
```

**CSS for feedback:**
```css
.copy-success {
  background: #22c55e;
  color: white;
}
```

### Pattern 2: Plain Text Summary Format
**What:** Format bill summary as copyable plain text
**When to use:** Exporting/sharing bill splits
**Example:**
```typescript
function generateSummary(shares: PersonShare[], dishes: Dish[]): string {
  const lines: string[] = [];
  lines.push("Bill Split Summary");
  lines.push("==================");
  lines.push("");

  for (const share of shares) {
    lines.push(`${share.personId}: ${formatCents(share.totalCents)}`);
    // Optionally include item breakdown
    for (const item of share.items) {
      lines.push(`  - ${item.itemName}: ${formatCents(item.shareCents)}`);
    }
  }

  lines.push("");
  lines.push(`Total: ${formatCents(totalCents)}`);

  return lines.join("\n");
}
```

### Pattern 3: Keyboard-Only Data Entry Flow
**What:** Natural Tab/Enter flow through form without needing modifier shortcuts
**When to use:** Forms where users enter data sequentially
**Key behaviors:**
- Tab moves forward through all inputs in logical order
- Shift+Tab moves backward
- Enter in last field of a section can add new entry or move to next section
- All interactive elements are focusable and have visible focus states

**Example - Tab order for bill splitter:**
1. First diner name → Tab → Second diner name → ... → Last diner name
2. Tab → First dish name → Tab → qty → Tab → price
3. Tab from price → auto-adds new dish row if current has content, focuses new dish name
4. After all dishes: Tab → Tax → Tab → Tip → Tab → Total
5. Final Tab → Copy Summary button (optional)

**Enter key handling:**
```typescript
// In diner name input
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addDiner(); // Add new diner and focus it
  }
});

// In last dish price input
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addDish(); // Add new dish and focus its name
  }
});
```

**Focus management:**
```typescript
// After adding new diner, focus the new input
function addDiner(): void {
  state.diners.push("");
  saveDiners(state.diners);
  render();
  // Focus the newly added input
  const inputs = document.querySelectorAll(".diner-input");
  const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
  lastInput?.focus();
}
```

### Pattern 5: Expandable Share Details
**What:** Show item breakdown for each person, collapsible
**When to use:** Detailed bill breakdown display
**Example:**
```html
<!-- Using native details/summary for accessibility -->
<details class="share-details">
  <summary class="share-row">
    <span class="share-name">Alice</span>
    <span class="share-amount">$25.50</span>
  </summary>
  <div class="share-breakdown">
    <div class="breakdown-item">
      <span>Burger (1/2 share)</span>
      <span>$8.00</span>
    </div>
    <div class="breakdown-item">
      <span>Fries</span>
      <span>$4.00</span>
    </div>
    <div class="breakdown-totals">
      <div>Subtotal: $12.00</div>
      <div>Tax: $1.02</div>
      <div>Tip: $2.40</div>
    </div>
  </div>
</details>
```

### Anti-Patterns to Avoid
- **Toast notifications for copy feedback:** Accessibility issues, often disappear before screen readers announce them
- **`accesskey` attribute:** Inconsistent browser/OS implementation, conflicts with assistive tech
- **Single-letter shortcuts without modifier:** Interfere with screen reader commands
- **Override Ctrl+C/Ctrl+V:** Critical shortcuts users expect to work normally
- **`keypress` event:** Deprecated, use `keydown` instead
- **`keyCode` property:** Deprecated, use `key` or `code` instead

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible sections | Custom accordion JS | Native `<details>/<summary>` | Built-in accessibility, no JS needed |
| Toast notifications | Custom toast system | Inline button text change | Simpler, more accessible |
| Clipboard fallback | `document.execCommand` | `navigator.clipboard.writeText()` | `execCommand` is deprecated |
| Key code detection | `event.keyCode` | `event.key` | `keyCode` is deprecated |
| Focus trapping (modals) | Custom focus management | Careful, minimal modals | Focus trapping is complex; keep modals simple |

**Key insight:** Native HTML elements like `<details>` provide accessibility for free. The Clipboard API is mature and doesn't need polyfills for modern browsers.

## Common Pitfalls

### Pitfall 1: Clipboard API on HTTP
**What goes wrong:** `navigator.clipboard` is undefined or throws error
**Why it happens:** Clipboard API requires secure context (HTTPS or localhost)
**How to avoid:** Always deploy to HTTPS; works on localhost during development
**Warning signs:** "TypeError: Cannot read property 'writeText' of undefined"

### Pitfall 2: Safari Async Clipboard Issues
**What goes wrong:** Clipboard write fails in Safari when called from async context
**Why it happens:** Safari requires clipboard access within synchronous user gesture
**How to avoid:** Call `writeText()` directly in click handler, not after await
**Warning signs:** "NotAllowedError: The request is not allowed by the user agent"
**Solution:**
```typescript
// BAD: Async before clipboard
button.addEventListener("click", async () => {
  const text = await generateSummary(); // Safari may fail after this
  await navigator.clipboard.writeText(text);
});

// GOOD: Synchronous call to clipboard
button.addEventListener("click", () => {
  const text = generateSummarySync(); // Keep it sync
  navigator.clipboard.writeText(text).then(...);
});
```

### Pitfall 3: Tab Order Broken by Dynamic Elements
**What goes wrong:** Tab skips inputs or jumps unexpectedly after adding new row
**Why it happens:** New elements added at wrong position in DOM, or focus not managed after render
**How to avoid:**
- After render, explicitly focus the intended next element
- Keep DOM structure stable (new rows added at end of container)
- Test full tab flow after each dynamic addition
**Warning signs:** Tab jumps to unexpected element after adding diner/dish

### Pitfall 4: Focus Lost After Re-render
**What goes wrong:** User is typing, re-render happens, focus moves to start of page
**Why it happens:** Full re-render replaces focused element without restoring focus
**How to avoid:**
- Track which element was focused before render
- After render, restore focus to equivalent element
- Or: only re-render sections that changed
**Warning signs:** User loses place when typing triggers state update

### Pitfall 5: Invisible Copied Feedback for Screen Readers
**What goes wrong:** Screen reader users don't know copy succeeded
**Why it happens:** Visual feedback only, no `aria-live` announcement
**How to avoid:** Add `role="status"` and `aria-live="polite"` to feedback region
**Warning signs:** Screen reader users ask "did it copy?"

## Code Examples

### Complete Copy Button Implementation
```typescript
// Source: MDN Clipboard API + accessibility best practices
function renderCopyButton(getSummaryText: () => string): HTMLElement {
  const container = document.createElement("div");
  container.className = "copy-container";

  const button = document.createElement("button");
  button.className = "copy-btn";
  button.textContent = "Copy Summary";
  button.setAttribute("aria-keyshortcuts", "Control+Shift+C");

  // Feedback region for screen readers
  const feedback = document.createElement("span");
  feedback.className = "copy-feedback";
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");

  button.addEventListener("click", () => {
    const text = getSummaryText();

    navigator.clipboard.writeText(text)
      .then(() => {
        button.textContent = "Copied!";
        button.classList.add("copy-success");
        feedback.textContent = "Summary copied to clipboard";

        setTimeout(() => {
          button.textContent = "Copy Summary";
          button.classList.remove("copy-success");
          feedback.textContent = "";
        }, 2000);
      })
      .catch(() => {
        button.textContent = "Copy failed";
        feedback.textContent = "Failed to copy to clipboard";

        setTimeout(() => {
          button.textContent = "Copy Summary";
          feedback.textContent = "";
        }, 2000);
      });
  });

  container.appendChild(button);
  container.appendChild(feedback);
  return container;
}
```

### Focus Preservation During Re-render
```typescript
// Track active element before render
function render(): void {
  const activeId = document.activeElement?.id;
  const activeDataIndex = (document.activeElement as HTMLElement)?.dataset?.index;
  const activeType = (document.activeElement as HTMLElement)?.dataset?.type;

  // ... actual render code ...

  // Restore focus after render
  if (activeId) {
    document.getElementById(activeId)?.focus();
  } else if (activeDataIndex && activeType) {
    const selector = `[data-index="${activeDataIndex}"][data-type="${activeType}"]`;
    (document.querySelector(selector) as HTMLElement)?.focus();
  }
}
```

### Enter Key for Quick Add
```typescript
// Add Enter key support to diner inputs
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    // Add new diner and focus it
    state.diners.push("");
    saveDiners(state.diners);
    render();
    focusLastDinerInput();
  }
});
```

### Plain Text Summary Generation
```typescript
function generatePlainTextSummary(
  shares: PersonShare[],
  dishes: Dish[],
  totalCents: number
): string {
  const lines: string[] = [];

  lines.push("Bill Split Summary");
  lines.push("==================");
  lines.push("");

  // List each person's share with breakdown
  for (const share of shares) {
    lines.push(`${share.personId}: ${formatCents(share.totalCents)}`);

    // Item breakdown
    for (const item of share.items) {
      const dish = dishes.find(d => d.id === item.itemId);
      const dishName = dish?.name || item.itemName;
      lines.push(`  - ${dishName}: ${formatCents(item.shareCents)}`);
    }

    // Show tax/tip if non-zero
    if (share.taxCents > 0 || share.tipCents > 0) {
      lines.push(`  Tax: ${formatCents(share.taxCents)}`);
      lines.push(`  Tip: ${formatCents(share.tipCents)}`);
    }
    lines.push("");
  }

  lines.push(`Total: ${formatCents(totalCents)}`);

  return lines.join("\n");
}
```

### CSS for Focus States
```css
/* Visible focus states for keyboard navigation */
input:focus,
button:focus {
  outline: 2px solid #4a90d9;
  outline-offset: 2px;
}

/* Optional: different focus style for chips */
.chip:focus {
  outline: 2px solid #4a90d9;
  outline-offset: 1px;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.execCommand("copy")` | `navigator.clipboard.writeText()` | 2020 (Baseline) | Promise-based, cleaner API |
| `keypress` event | `keydown` event | Deprecated | `keypress` deprecated |
| `event.keyCode` | `event.key` / `event.code` | Modern browsers | Cleaner, more readable |
| `accesskey` attribute | JS keyboard handlers | N/A | More control, better UX |
| Toast libraries | Inline feedback | Trend | Simpler, more accessible |

**Deprecated/outdated:**
- `document.execCommand()`: Deprecated, replaced by Clipboard API
- `keypress` event: Deprecated, use `keydown`
- `event.keyCode` / `event.which`: Deprecated, use `event.key`
- `accesskey` attribute: Poor browser support, unpredictable modifiers

## Open Questions

None - all features use well-documented, stable browser APIs.

## Sources

### Primary (HIGH confidence)
- [MDN Clipboard API: writeText()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText) - API syntax, browser support
- [MDN keydown event](https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event) - Event handling
- [MDN aria-keyshortcuts](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-keyshortcuts) - Accessibility attribute
- [Can I Use: Clipboard API](https://caniuse.com/mdn-api_clipboard_writetext) - Browser compatibility
- [WebAIM Keyboard Accessibility](https://webaim.org/techniques/keyboard/) - Accessibility best practices

### Secondary (MEDIUM confidence)
- [W3C WAI Keyboard Compatibility](https://www.w3.org/WAI/perspective-videos/keyboard/) - WCAG guidelines
- [Toast Notification Best Practices - LogRocket](https://blog.logrocket.com/ux-design/toast-notifications/) - UX patterns
- [Carbon Design System - Notifications](https://carbondesignsystem.com/components/notification/usage/) - Design patterns

### Tertiary (LOW confidence)
- WebSearch on Safari clipboard issues - platform quirks (verified with MDN)

## Metadata

**Confidence breakdown:**
- Clipboard API: HIGH - MDN documentation, Baseline since 2020
- Keyboard shortcuts: HIGH - Standard DOM events, well-documented
- Accessibility patterns: HIGH - WebAIM and W3C WAI guidelines
- Safari quirks: MEDIUM - Known issue, documented workaround

**Research date:** 2026-01-18
**Valid until:** 2026-03-18 (stable browser APIs, unlikely to change)
