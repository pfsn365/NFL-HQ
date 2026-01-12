/**
 * Protection Resolution Engine
 * Parses and evaluates draft pick protections to determine if/when picks convey
 */

export interface ProtectionRule {
  year: number;
  type: 'top' | 'bottom' | 'unprotected' | 'range';
  protectedStart?: number; // For top-N or range
  protectedEnd?: number;   // For range (e.g., protected 15-30)
  fallback?: string;        // What happens if protection doesn't convey
}

export interface ProtectionResolution {
  willConvey: boolean;
  conveysInYear?: number;
  actualPickNumber?: number;
  protectedRange?: string;
  explanation: string;
  alternativeOutcome?: string; // e.g., "becomes 2028 2nd round pick"
}

export class ProtectionEngine {
  /**
   * Parse protection string into structured rules
   * Examples:
   * - "Top-10 protected (2026), Top-8 protected (2027), unprotected (2028)"
   * - "Protected 1-14; if not conveyed by 2028, becomes 2028 2nd"
   * - "Protected 15-30"
   */
  parseProtection(protectionStr: string): ProtectionRule[] {
    if (!protectionStr || protectionStr.trim() === '' || protectionStr === 'No protections') {
      return [{ year: 0, type: 'unprotected' }];
    }

    const rules: ProtectionRule[] = [];
    const lowerStr = protectionStr.toLowerCase();

    // Handle "unprotected" case
    if (lowerStr.includes('unprotected') && !lowerStr.includes('if')) {
      const yearMatch = protectionStr.match(/\((\d{4})\)/);
      return [{ year: yearMatch ? parseInt(yearMatch[1]) : 0, type: 'unprotected' }];
    }

    // Split by common delimiters
    const segments = protectionStr.split(/[;,]|(?:then)|(?:if not conveyed)/i);

    for (const segment of segments) {
      const trimmed = segment.trim();
      if (!trimmed) continue;

      const rule = this.parseProtectionSegment(trimmed);
      if (rule) {
        rules.push(rule);
      }
    }

    // If no rules parsed, treat as unprotected
    if (rules.length === 0) {
      return [{ year: 0, type: 'unprotected' }];
    }

    return rules;
  }

  private parseProtectionSegment(segment: string): ProtectionRule | null {
    const lowerSeg = segment.toLowerCase();

    // Extract year if present
    const yearMatch = segment.match(/\((\d{4})\)|\b(20\d{2})\b/);
    const year = yearMatch ? parseInt(yearMatch[1] || yearMatch[2]) : 0;

    // Check for "top-N protected" pattern
    const topMatch = segment.match(/top[-\s]*(\d+)\s*protected/i);
    if (topMatch) {
      return {
        year,
        type: 'top',
        protectedStart: 1,
        protectedEnd: parseInt(topMatch[1])
      };
    }

    // Check for "protected 1-N" or "protected N-M" pattern
    const rangeMatch = segment.match(/protected\s*(\d+)[-\s]*(\d+)/i);
    if (rangeMatch) {
      return {
        year,
        type: 'range',
        protectedStart: parseInt(rangeMatch[1]),
        protectedEnd: parseInt(rangeMatch[2])
      };
    }

    // Check for "unprotected"
    if (lowerSeg.includes('unprotected')) {
      return { year, type: 'unprotected' };
    }

    // Check for fallback scenarios (becomes 2nd round pick, etc.)
    if (lowerSeg.includes('becomes') || lowerSeg.includes('converts to')) {
      const fallbackMatch = segment.match(/becomes?\s+(.+?)(?:\.|$)/i);
      if (fallbackMatch) {
        return {
          year,
          type: 'unprotected',
          fallback: fallbackMatch[1].trim()
        };
      }
    }

    return null;
  }

  /**
   * Evaluate if a pick conveys based on its projected position
   * @param protectionStr - The protection string to evaluate
   * @param projectedPickNumber - The projected draft position (1-30 for round 1)
   * @param currentYear - The current year to check against
   */
  evaluateProtection(
    protectionStr: string,
    projectedPickNumber: number,
    currentYear: number
  ): ProtectionResolution {
    const rules = this.parseProtection(protectionStr);

    // Find the rule for current year
    let applicableRule = rules.find(r => r.year === currentYear);

    // If no rule for current year, find the first rule without a year or latest rule
    if (!applicableRule) {
      applicableRule = rules.find(r => r.year === 0) || rules[rules.length - 1];
    }

    if (!applicableRule) {
      return {
        willConvey: true,
        conveysInYear: currentYear,
        actualPickNumber: projectedPickNumber,
        explanation: 'No protection rules found, pick conveys'
      };
    }

    return this.evaluateRule(applicableRule, projectedPickNumber, currentYear, rules);
  }

  private evaluateRule(
    rule: ProtectionRule,
    pickNumber: number,
    year: number,
    allRules: ProtectionRule[]
  ): ProtectionResolution {
    // Unprotected always conveys
    if (rule.type === 'unprotected') {
      return {
        willConvey: true,
        conveysInYear: year,
        actualPickNumber: pickNumber,
        explanation: `Pick ${pickNumber} conveys (unprotected)`,
        alternativeOutcome: rule.fallback
      };
    }

    // Top-N protected
    if (rule.type === 'top' && rule.protectedEnd) {
      const isProtected = pickNumber <= rule.protectedEnd;

      if (isProtected) {
        // Find next year's rule
        const nextRule = this.findNextYearRule(allRules, year);
        const nextYear = nextRule?.year || year + 1;

        return {
          willConvey: false,
          protectedRange: `1-${rule.protectedEnd}`,
          explanation: `Pick ${pickNumber} is protected (Top-${rule.protectedEnd}). Will roll to ${nextYear}.`,
          alternativeOutcome: nextRule?.fallback || `Rolls to ${nextYear}`,
          conveysInYear: nextYear
        };
      } else {
        return {
          willConvey: true,
          conveysInYear: year,
          actualPickNumber: pickNumber,
          protectedRange: `1-${rule.protectedEnd}`,
          explanation: `Pick ${pickNumber} conveys (outside Top-${rule.protectedEnd} protection)`
        };
      }
    }

    // Range protected (e.g., protected 15-30)
    if (rule.type === 'range' && rule.protectedStart && rule.protectedEnd) {
      const isProtected = pickNumber >= rule.protectedStart && pickNumber <= rule.protectedEnd;

      if (isProtected) {
        return {
          willConvey: false,
          protectedRange: `${rule.protectedStart}-${rule.protectedEnd}`,
          explanation: `Pick ${pickNumber} is protected (picks ${rule.protectedStart}-${rule.protectedEnd} protected)`,
          alternativeOutcome: rule.fallback
        };
      } else {
        return {
          willConvey: true,
          conveysInYear: year,
          actualPickNumber: pickNumber,
          protectedRange: `${rule.protectedStart}-${rule.protectedEnd}`,
          explanation: `Pick ${pickNumber} conveys (outside ${rule.protectedStart}-${rule.protectedEnd} protection)`
        };
      }
    }

    // Default: convey
    return {
      willConvey: true,
      conveysInYear: year,
      actualPickNumber: pickNumber,
      explanation: 'Pick conveys'
    };
  }

  private findNextYearRule(rules: ProtectionRule[], currentYear: number): ProtectionRule | null {
    // Find the next rule with a year greater than current
    const futureRules = rules.filter(r => r.year > currentYear).sort((a, b) => a.year - b.year);
    return futureRules[0] || null;
  }

  /**
   * Get a human-readable summary of protections
   */
  getProtectionSummary(protectionStr: string): string {
    const rules = this.parseProtection(protectionStr);

    if (rules.length === 0 || rules[0].type === 'unprotected') {
      return 'Unprotected';
    }

    const summaries = rules.map(rule => {
      const yearStr = rule.year > 0 ? ` (${rule.year})` : '';

      if (rule.type === 'top' && rule.protectedEnd) {
        return `Top-${rule.protectedEnd} protected${yearStr}`;
      }

      if (rule.type === 'range' && rule.protectedStart && rule.protectedEnd) {
        return `Protected ${rule.protectedStart}-${rule.protectedEnd}${yearStr}`;
      }

      if (rule.type === 'unprotected') {
        return `Unprotected${yearStr}`;
      }

      return 'Protected';
    });

    return summaries.join(', ');
  }

  /**
   * Simulate protection resolution across multiple years
   * Returns the year when the pick will definitely convey
   */
  simulateConveyance(
    protectionStr: string,
    projectedPickNumbers: { [year: number]: number }
  ): { conveysInYear: number; pickNumber: number; explanation: string } | null {
    const rules = this.parseProtection(protectionStr);

    // Sort rules by year
    const sortedRules = rules.filter(r => r.year > 0).sort((a, b) => a.year - b.year);

    if (sortedRules.length === 0) {
      // No year-specific rules, check if unprotected
      const firstYear = Math.min(...Object.keys(projectedPickNumbers).map(Number));
      const resolution = this.evaluateProtection(protectionStr, projectedPickNumbers[firstYear], firstYear);

      if (resolution.willConvey && resolution.conveysInYear) {
        return {
          conveysInYear: resolution.conveysInYear,
          pickNumber: projectedPickNumbers[firstYear],
          explanation: resolution.explanation
        };
      }
      return null;
    }

    // Check each year in sequence
    for (const rule of sortedRules) {
      const pickNumber = projectedPickNumbers[rule.year];
      if (pickNumber === undefined) continue;

      const resolution = this.evaluateProtection(protectionStr, pickNumber, rule.year);

      if (resolution.willConvey && resolution.conveysInYear) {
        return {
          conveysInYear: resolution.conveysInYear,
          pickNumber,
          explanation: resolution.explanation
        };
      }
    }

    return null;
  }

  /**
   * Check if a protection is complex (has multiple conditions, fallbacks, etc.)
   */
  isComplexProtection(protectionStr: string): boolean {
    const lowerStr = protectionStr.toLowerCase();
    return (
      lowerStr.includes('swap') ||
      lowerStr.includes('or') ||
      lowerStr.includes('more favorable') ||
      lowerStr.includes('complex') ||
      (lowerStr.match(/\d{4}/g) || []).length > 2 // Multiple years mentioned
    );
  }
}

// Export singleton instance
export const protectionEngine = new ProtectionEngine();
