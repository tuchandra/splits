# Phase 1: Foundation - Research

**Researched:** 2026-01-18
**Domain:** TypeScript/Bun project setup, static site deployment, bill splitting calculations
**Confidence:** HIGH

## Summary

Phase 1 establishes a TypeScript project with Bun as the runtime and build tool, deploys to GitHub Pages as a subdirectory of an existing custom domain, and implements pure calculation functions for proportional bill splitting.

Bun provides an all-in-one toolchain: runtime, package manager, bundler, and test runner. TypeScript works natively without compilation steps. The built-in test runner is Jest-compatible and sufficient for pure function testing. Static HTML building is first-class with `bun build ./index.html`.

For GitHub Pages deployment to `tusharc.dev/split`, the project deploys to a separate repo with Pages enabled. When a custom domain is configured on the main `username.github.io` repo, all other repos with Pages enabled automatically deploy to subdirectories of that domain.

**Primary recommendation:** Use Bun's native tooling exclusively (no Vite, no Jest), store money as integer cents, use the proportional allocation algorithm for tax/tip/fee distribution.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Bun | latest | Runtime, package manager, bundler, test runner | All-in-one, native TypeScript, extremely fast |
| TypeScript | 5.x | Type safety | Bun runs .ts files directly |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/bun | latest | Type definitions for Bun APIs | Always (dev dependency) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Bun test | Jest/Vitest | More ecosystem support, but Bun test is sufficient and faster for pure functions |
| Integer cents | Dinero.js/ts-money | Library provides more features, but overkill for this simple use case |
| Manual build | Vite | Vite has more plugins, but Bun's HTML bundler is zero-config and sufficient |

**Installation:**
```bash
bun init
bun add -d @types/bun
```

## Architecture Patterns

### Recommended Project Structure
```
splits/
├── src/
│   ├── index.html          # Entry point for static site
│   ├── main.ts             # App entry (if needed)
│   └── lib/
│       └── calculate.ts    # Pure calculation functions
├── tests/
│   └── calculate.test.ts   # Unit tests for calculations
├── dist/                   # Build output (gitignored)
├── package.json
├── tsconfig.json
├── bunfig.toml             # Optional Bun config
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Actions deployment
```

### Pattern 1: Pure Calculation Functions
**What:** All calculation logic as pure functions with no side effects
**When to use:** Always for business logic that transforms data
**Example:**
```typescript
// Source: Martin Fowler's Money pattern + proportional allocation
interface LineItem {
  name: string;
  amountCents: number;        // Store as integer cents
  assignedTo: string[];       // Person IDs
}

interface BillInput {
  items: LineItem[];
  taxCents: number;
  tipCents: number;
  feesCents: number;
}

interface PersonShare {
  personId: string;
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  feesCents: number;
  totalCents: number;
}

function calculateShares(bill: BillInput): PersonShare[] {
  // Pure function: same input always produces same output
  // No mutation of input, no side effects
}
```

### Pattern 2: Money as Integer Cents
**What:** Store all monetary values as integers representing cents
**When to use:** Any monetary calculation
**Example:**
```typescript
// Source: https://frontstuff.io/how-to-handle-monetary-values-in-javascript
// BAD: Floating point errors
const price = 0.1 + 0.2; // 0.30000000000000004

// GOOD: Integer cents
const priceCents = 10 + 20; // 30 (represents $0.30)

// Display formatting
function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}
```

### Pattern 3: Proportional Allocation with Remainder Distribution
**What:** Distribute shared costs (tax/tip/fees) proportionally, handle remainder pennies
**When to use:** When splitting costs that can't divide evenly
**Example:**
```typescript
// Source: Pro rata allocation principle
function allocateProportionally(
  totalCents: number,
  shares: { id: string; weight: number }[]
): Map<string, number> {
  const totalWeight = shares.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return new Map();

  const result = new Map<string, number>();
  let allocated = 0;

  // Allocate proportionally, truncating
  for (const share of shares) {
    const amount = Math.floor((totalCents * share.weight) / totalWeight);
    result.set(share.id, amount);
    allocated += amount;
  }

  // Distribute remainder pennies round-robin
  let remainder = totalCents - allocated;
  let i = 0;
  while (remainder > 0) {
    const id = shares[i % shares.length].id;
    result.set(id, (result.get(id) || 0) + 1);
    remainder--;
    i++;
  }

  return result;
}
```

### Anti-Patterns to Avoid
- **Floating point for money:** Use integer cents, never `number` for dollar amounts
- **Mutation in calculations:** Keep calculation functions pure; return new objects
- **Percentage-based splitting only:** Always handle remainder pennies explicitly
- **Coupling UI state with calculation:** Pass plain data in, get plain data out

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test runner | Custom test harness | `bun test` | Built-in, Jest-compatible, fast |
| TypeScript compilation | tsc scripts | Bun native execution | Bun runs .ts directly |
| Build tooling | Webpack/esbuild config | `bun build ./index.html` | Zero-config, handles HTML/JS/CSS |
| Floating point money | Manual rounding | Integer cents pattern | Rounding errors compound |

**Key insight:** Bun eliminates the need for most JavaScript tooling. Don't add npm packages for problems Bun solves natively.

## Common Pitfalls

### Pitfall 1: Floating Point Money
**What goes wrong:** `0.1 + 0.2 !== 0.3` causes penny discrepancies
**Why it happens:** IEEE 754 binary floating point can't represent all decimals exactly
**How to avoid:** Store all money as integer cents, convert only for display
**Warning signs:** Tests failing with values like `10.000000000001`

### Pitfall 2: Lost Pennies in Splitting
**What goes wrong:** `$10.00 / 3 = $3.33 * 3 = $9.99` (lost a penny)
**Why it happens:** Integer division truncates; most devs forget the remainder
**How to avoid:** Use `allocateProportionally` pattern that distributes remainder
**Warning signs:** Sum of shares doesn't equal total

### Pitfall 3: Division by Zero
**What goes wrong:** Dividing tax by subtotal when subtotal is 0
**Why it happens:** Edge case when no items assigned to anyone
**How to avoid:** Check for zero subtotal before proportional allocation
**Warning signs:** NaN or Infinity in results

### Pitfall 4: Empty Assignment Arrays
**What goes wrong:** Item with `assignedTo: []` gets dropped or causes errors
**Why it happens:** Forgetting to handle unassigned items
**How to avoid:** Track unassigned items separately, warn user
**Warning signs:** Sum of item assignments !== total items

### Pitfall 5: GitHub Pages Base Path
**What goes wrong:** Assets load from `/` instead of `/split/`
**Why it happens:** Build doesn't know about subdirectory deployment
**How to avoid:** Use relative paths (`./`) or configure base path in HTML
**Warning signs:** 404 errors for JS/CSS on deployed site

## Code Examples

Verified patterns from official sources:

### Bun Project Initialization
```bash
# Source: https://bun.com/docs/runtime/typescript
bun init
bun add -d @types/bun
```

### tsconfig.json (Bun Recommended)
```json
// Source: https://bun.com/docs/runtime/typescript
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### Bun Test Example
```typescript
// Source: https://bun.com/docs/test
import { expect, test, describe } from "bun:test";

describe("calculateShares", () => {
  test("splits shared item evenly", () => {
    const result = splitEvenly(1000, ["alice", "bob"]); // $10.00
    expect(result.get("alice")).toBe(500);
    expect(result.get("bob")).toBe(500);
  });

  test("handles odd amounts with remainder", () => {
    const result = splitEvenly(1001, ["alice", "bob"]); // $10.01
    // One person gets the extra penny
    expect(result.get("alice")! + result.get("bob")!).toBe(1001);
  });
});
```

### Build Command
```bash
# Source: https://bun.com/docs/bundler/html-static
bun build ./src/index.html --minify --outdir=dist
```

### GitHub Actions Workflow
```yaml
# Source: https://github.com/oven-sh/setup-bun + https://github.com/peaceiris/actions-gh-pages
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install --frozen-lockfile

      - run: bun test

      - run: bun run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        if: github.ref == 'refs/heads/main'
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Calculation Function Skeleton
```typescript
// Core types
interface LineItem {
  id: string;
  name: string;
  amountCents: number;
  assignedTo: string[]; // empty = unassigned
}

interface BillInput {
  items: LineItem[];
  taxCents: number;
  tipCents: number;
  feesCents: number;
  participants: string[];
}

interface PersonShare {
  personId: string;
  items: { itemId: string; shareCents: number }[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  feesCents: number;
  totalCents: number;
}

interface BillResult {
  shares: PersonShare[];
  unassignedItems: LineItem[];
  totalCents: number;
}

// Main calculation function (pure)
export function calculateBill(input: BillInput): BillResult {
  // 1. Calculate each person's subtotal from their share of items
  // 2. Proportionally allocate tax based on subtotal ratios
  // 3. Proportionally allocate tip based on subtotal ratios
  // 4. Proportionally allocate fees based on subtotal ratios
  // 5. Sum up each person's total
  // 6. Return result with unassigned items flagged
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm + tsc + Jest | Bun (all-in-one) | 2023-2024 | Simpler setup, faster execution |
| Webpack/Vite for bundling | `bun build` | 2024 | Zero-config HTML bundling |
| Floating point money | Integer cents | Always best practice | Eliminates rounding errors |

**Deprecated/outdated:**
- `ts-node`: Use Bun for direct TypeScript execution
- `npm`: Use Bun's package manager (`bun install`)
- Manual Jest configuration: Use `bun test` with built-in Jest compatibility

## Open Questions

Things that couldn't be fully resolved:

1. **Base path configuration for subdirectory deployment**
   - What we know: Bun determines base path from file structure, relative paths work
   - What's unclear: Whether Bun has a `--base` flag like Vite for asset URLs
   - Recommendation: Use relative paths (`./`) in HTML, test deployment early

2. **Exact tusharc.dev setup**
   - What we know: Custom domain on main GH Pages repo enables subdirectory routing
   - What's unclear: Whether tusharc.dev is already configured with a main repo
   - Recommendation: Verify existing GitHub Pages setup before first deployment

## Sources

### Primary (HIGH confidence)
- [Bun TypeScript docs](https://bun.com/docs/runtime/typescript) - tsconfig, native execution
- [Bun Test docs](https://bun.com/docs/test) - test runner API, Jest compatibility
- [Bun HTML/Static docs](https://bun.com/docs/bundler/html-static) - build command, dev server
- [oven-sh/setup-bun](https://github.com/oven-sh/setup-bun) - GitHub Actions setup
- [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages) - deployment action

### Secondary (MEDIUM confidence)
- [frontstuff.io money handling](https://frontstuff.io/how-to-handle-monetary-values-in-javascript) - integer cents pattern
- [GitHub Pages subdirectory deployment](https://samhermes.com/posts/deploying-repository-subdirectory-github-pages-site/) - custom domain + subdirectory

### Tertiary (LOW confidence)
- WebSearch results on bill splitting algorithms - general patterns, no authoritative source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Bun official documentation is comprehensive and current
- Architecture: HIGH - Money patterns are well-established best practices
- Pitfalls: HIGH - Floating point issues are well-documented; remainder handling is mathematical
- Deployment: MEDIUM - GitHub Pages subdirectory behavior confirmed but not tested with this specific setup

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (Bun is fast-moving; revalidate after major releases)
