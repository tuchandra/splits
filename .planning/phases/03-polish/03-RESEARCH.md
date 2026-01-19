# Phase 3: Polish - Research

**Researched:** 2026-01-18
**Domain:** Output display, clipboard API, keyboard shortcuts, accessibility
**Confidence:** HIGH

## Summary

Phase 3 adds polish features: enhanced output display showing breakdown details, a copy/export summary feature using the Clipboard API, and keyboard shortcuts for desktop power users. These are all well-supported browser features that require minimal complexity.

The Individual Shares section already exists with basic totals. Enhancement involves showing item breakdowns (collapsible or expanded) and providing a "Copy Summary" button. The Clipboard API (`navigator.clipboard.writeText()`) is Baseline Widely Available since March 2020 and works in all modern browsers with HTTPS. Keyboard shortcuts use standard `keydown` event handling with modifier key detection.

**Primary recommendation:** Use inline button text change ("Copied!") for clipboard feedback rather than toast notifications. Implement keyboard shortcuts using `keydown` event on `document` with modifier keys (Ctrl/Cmd) to avoid conflicting with browser defaults. Use `?` key (no modifier) for showing help overlay following Gmail/GitHub convention.

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

### Pattern 3: Global Keyboard Shortcut Handler
**What:** Listen for keyboard shortcuts on document
**When to use:** App-wide shortcuts that work regardless of focus
**Example:**
```typescript
// Source: WebAIM keyboard accessibility guide
document.addEventListener("keydown", (e: KeyboardEvent) => {
  // Ignore if user is typing in an input
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
  }

  // Use metaKey for Mac, ctrlKey for Windows/Linux
  const modifier = e.metaKey || e.ctrlKey;

  // ? for help (no modifier required - Gmail/GitHub convention)
  if (e.key === "?" && !modifier) {
    e.preventDefault();
    showKeyboardHelp();
    return;
  }

  // Ctrl/Cmd+Shift+C for copy summary (avoid conflict with browser copy)
  if (modifier && e.shiftKey && e.key === "C") {
    e.preventDefault();
    copySummary();
    return;
  }

  // Ctrl/Cmd+D for add diner
  if (modifier && e.key === "d") {
    e.preventDefault();
    addDiner();
    return;
  }

  // Escape to close help modal
  if (e.key === "Escape") {
    closeKeyboardHelp();
    return;
  }
});
```

### Pattern 4: Help Modal with Keyboard Shortcut List
**What:** Modal overlay showing available shortcuts, triggered by `?`
**When to use:** Apps with multiple keyboard shortcuts
**Example:**
```typescript
function renderHelpModal(): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "help-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Keyboard shortcuts");

  const modal = document.createElement("div");
  modal.className = "help-modal";
  modal.innerHTML = `
    <h2>Keyboard Shortcuts</h2>
    <table>
      <tr><td><kbd>?</kbd></td><td>Show this help</td></tr>
      <tr><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd></td><td>Copy summary</td></tr>
      <tr><td><kbd>Ctrl</kbd>+<kbd>D</kbd></td><td>Add diner</td></tr>
      <tr><td><kbd>Ctrl</kbd>+<kbd>I</kbd></td><td>Add dish</td></tr>
      <tr><td><kbd>Esc</kbd></td><td>Close this help</td></tr>
    </table>
    <button class="close-btn">Close</button>
  `;

  overlay.appendChild(modal);
  return overlay;
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

### Pitfall 3: Shortcut Conflicts
**What goes wrong:** Keyboard shortcuts don't work or break browser features
**Why it happens:** Using shortcuts reserved by browser/OS/assistive tech
**How to avoid:**
- Use `Ctrl+Shift+key` combinations (less likely to conflict)
- Never override Ctrl+C, Ctrl+V, Ctrl+Z, Ctrl+A
- Test with screen readers
- Allow `?` without modifier (Gmail/GitHub convention)
**Warning signs:** Users report shortcut doesn't work on their system

### Pitfall 4: Shortcuts Fire in Input Fields
**What goes wrong:** Typing `d` in an input triggers "add diner"
**Why it happens:** Not checking if event target is an input element
**How to avoid:** Check `e.target instanceof HTMLInputElement` before handling
**Warning signs:** Users can't type certain letters in forms

### Pitfall 5: Modal Doesn't Trap Focus
**What goes wrong:** Tab key moves focus behind modal, confusing keyboard users
**Why it happens:** Modal doesn't implement focus trapping
**How to avoid:** For simple help modal, just close on Escape and any click outside
**Warning signs:** Accessibility audit fails on keyboard navigation

### Pitfall 6: Invisible Copied Feedback for Screen Readers
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

### Keyboard Shortcut Handler with Modifier Detection
```typescript
// Source: WebAIM + MDN keyboard events
function setupKeyboardShortcuts(actions: {
  copySummary: () => void;
  addDiner: () => void;
  addDish: () => void;
  toggleHelp: () => void;
}): void {
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    // Ignore when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      return;
    }

    // Handle Cmd (Mac) or Ctrl (Windows/Linux)
    const modifier = e.metaKey || e.ctrlKey;

    switch (true) {
      // ? shows help (no modifier, following Gmail/GitHub)
      case e.key === "?" && !modifier && !e.shiftKey:
        e.preventDefault();
        actions.toggleHelp();
        break;

      // Ctrl/Cmd+Shift+C copies summary (avoid conflict with browser copy)
      case modifier && e.shiftKey && e.key.toLowerCase() === "c":
        e.preventDefault();
        actions.copySummary();
        break;

      // Ctrl/Cmd+D adds diner
      case modifier && e.key.toLowerCase() === "d":
        e.preventDefault();
        actions.addDiner();
        break;

      // Ctrl/Cmd+I adds dish (item)
      case modifier && e.key.toLowerCase() === "i":
        e.preventDefault();
        actions.addDish();
        break;

      // Escape closes help
      case e.key === "Escape":
        actions.toggleHelp(); // Will close if open
        break;
    }
  });
}
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

### CSS for Help Modal Overlay
```css
.help-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.help-modal {
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.help-modal h2 {
  margin: 0 0 16px 0;
}

.help-modal table {
  width: 100%;
  border-collapse: collapse;
}

.help-modal td {
  padding: 8px 0;
}

.help-modal td:first-child {
  width: 50%;
}

.help-modal kbd {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 12px;
}

.help-modal .close-btn {
  margin-top: 16px;
  width: 100%;
  padding: 8px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
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
