/**
 * AgentLevy — Task Spec Registry
 *
 * Defines the standard service types that agents can transact over.
 * Each spec is a machine-readable contract between Agent A and Agent B.
 *
 * Security guarantee:
 *   Agent A can't change goalposts after payment is locked.
 *   Agent B knows exactly what they're being evaluated against before starting.
 *   The TEE verifies against the COMMITTED spec hash — not whatever either party claims.
 *
 * For the hackathon: 5 standard service types with deterministic checks.
 * For production: agent-negotiated specs + LLM parsing of natural language specs.
 */

import { createHash } from 'crypto';

// ─── SPEC REGISTRY ────────────────────────────────────────────────────────────

export const SPEC_REGISTRY = {

  // ── 1. SENTIMENT ANALYSIS ─────────────────────────────────────────────────
  'sentiment-analysis': {
    version: '1.0',
    description: 'Sentiment analysis on a text corpus',
    pricing: {
      baseRLUSD: 10,
      perItem:   0.001,
    },
    input: {
      format:   'array',
      minItems: 1,
      maxItems: 10000,
      itemSchema: {
        id:   'string',
        text: 'string',
      },
    },
    output: {
      schema: {
        results: [{
          id:    'string',
          score: 'number',
          label: 'string',
        }],
        summary: {
          totalAnalyzed: 'number',
          avgScore:      'number',
          distribution:  'object',
        },
      },
    },
    qualityCriteria: {
      completionRate:  0.95,
      scoreRange:      [-1, 1],
      labelValid:      ['positive', 'negative', 'neutral'],
      minVariance:     0.05,
      processingTime:  { min: 500 },
    },
    checks: [
      'output_exists',
      'schema_valid',
      'completion_rate',
      'score_range',
      'label_valid',
      'score_variance',
      'processing_time',
    ],
    threshold: 0.75,
  },

  // ── 2. DATA EXTRACTION ────────────────────────────────────────────────────
  'data-extraction': {
    version: '1.0',
    description: 'Structured data extraction from unstructured text',
    pricing: {
      baseRLUSD: 15,
      perItem:   0.005,
    },
    input: {
      format:   'array',
      minItems: 1,
      maxItems: 1000,
      itemSchema: {
        id:     'string',
        text:   'string',
        schema: 'object',
      },
    },
    output: {
      schema: {
        results: [{
          id:         'string',
          extracted:  'object',
          confidence: 'number',
        }],
      },
    },
    qualityCriteria: {
      completionRate: 0.90,
      confidenceMin:  0.5,
      schemaMatch:    true,
      processingTime: { min: 1000 },
    },
    checks: [
      'output_exists',
      'schema_valid',
      'completion_rate',
      'confidence_range',
      'schema_match',
      'processing_time',
    ],
    threshold: 0.75,
  },

  // ── 3. CODE REVIEW ────────────────────────────────────────────────────────
  'code-review': {
    version: '1.0',
    description: 'Automated code review with severity ratings',
    pricing: {
      baseRLUSD: 20,
      perItem:   0.01,
    },
    input: {
      format: 'object',
      schema: {
        language: 'string',
        files:    'array',
      },
    },
    output: {
      schema: {
        issues: [{
          file:     'string',
          line:     'number',
          severity: 'string',
          message:  'string',
          rule:     'string',
        }],
        summary: {
          totalIssues: 'number',
          bySeverity:  'object',
        },
      },
    },
    qualityCriteria: {
      severityValid:  ['critical', 'high', 'medium', 'low', 'info'],
      hasLineNumbers: true,
      hasRuleIds:     true,
      processingTime: { min: 2000 },
    },
    checks: [
      'output_exists',
      'schema_valid',
      'severity_valid',
      'line_numbers',
      'rule_ids',
      'processing_time',
    ],
    threshold: 0.75,
  },

  // ── 4. TRANSLATION ────────────────────────────────────────────────────────
  'translation': {
    version: '1.0',
    description: 'Text translation between language pairs',
    pricing: {
      baseRLUSD: 8,
      perItem:   0.002,
    },
    input: {
      format: 'object',
      schema: {
        sourceLang: 'string',
        targetLang: 'string',
        texts:      'array',
      },
    },
    output: {
      schema: {
        translations: [{
          id:         'string',
          original:   'string',
          translated: 'string',
          confidence: 'number',
        }],
      },
    },
    qualityCriteria: {
      completionRate: 0.95,
      confidenceMin:  0.6,
      notIdentical:   true,
      processingTime: { min: 500 },
    },
    checks: [
      'output_exists',
      'schema_valid',
      'completion_rate',
      'confidence_range',
      'not_identical',
      'processing_time',
    ],
    threshold: 0.75,
  },

  // ── 5. DATA VALIDATION ────────────────────────────────────────────────────
  'data-validation': {
    version: '1.0',
    description: 'Validate dataset against schema and quality rules',
    pricing: {
      baseRLUSD: 5,
      perItem:   0.0005,
    },
    input: {
      format: 'object',
      schema: {
        dataset: 'array',
        rules:   'array',
      },
    },
    output: {
      schema: {
        valid:   'boolean',
        errors:  'array',
        summary: {
          totalRows:   'number',
          validRows:   'number',
          errorCount:  'number',
          errorRate:   'number',
        },
      },
    },
    qualityCriteria: {
      hasRowCounts:   true,
      hasErrorRate:   true,
      processingTime: { min: 300 },
    },
    checks: [
      'output_exists',
      'schema_valid',
      'row_counts',
      'error_rate',
      'processing_time',
    ],
    threshold: 0.75,
  },
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Get spec by service ID.
 */
export function getSpec(serviceId) {
  return SPEC_REGISTRY[serviceId] || null;
}

/**
 * Hash a task spec for on-chain commitment.
 * This hash goes into Treasury.sol at escrow time.
 * Neither party can change the spec after this is committed.
 */
export function hashSpec(serviceId, customizations = {}) {
  const spec = getSpec(serviceId);
  if (!spec) throw new Error(`Unknown service type: ${serviceId}`);
  const specWithCustomizations = { ...spec, customizations, serviceId };
  return '0x' + createHash('sha256')
    .update(JSON.stringify(specWithCustomizations, Object.keys(specWithCustomizations).sort()))
    .digest('hex');
}

/**
 * Calculate price for a task based on spec and input size.
 */
export function calculatePrice(serviceId, inputItems = 1) {
  const spec = getSpec(serviceId);
  if (!spec) throw new Error(`Unknown service type: ${serviceId}`);
  return spec.pricing.baseRLUSD + (inputItems * spec.pricing.perItem);
}

/**
 * List all available service types.
 */
export function listServices() {
  return Object.entries(SPEC_REGISTRY).map(([id, spec]) => ({
    id,
    description:  spec.description,
    basePrice:    spec.pricing.baseRLUSD,
    version:      spec.version,
  }));
}

/**
 * Verify that an output matches the committed spec.
 * This is what the TEE runs — deterministic, no interpretation.
 *
 * Returns { passed, checks, score, reason }
 */
export function verifyAgainstSpec(serviceId, output, taskMeta = {}) {
  const spec = getSpec(serviceId);
  if (!spec) return { passed: false, reason: `Unknown service: ${serviceId}` };

  const checks = {};
  const startTime = taskMeta.startTime || Date.now() - 5000;

  // ── UNIVERSAL CHECKS ──────────────────────────────────────────────────────

  checks.output_exists = (
    output !== null &&
    output !== undefined &&
    typeof output === 'object'
  );

  if (!checks.output_exists) {
    return { passed: false, checks, score: '0/1', reason: 'No output provided' };
  }

  checks.processing_time = (
    spec.qualityCriteria.processingTime
      ? (Date.now() - startTime) >= spec.qualityCriteria.processingTime.min
      : true
  );

  // ── SCHEMA CHECK ──────────────────────────────────────────────────────────
  checks.schema_valid = true; // simplified for hackathon

  // ── SERVICE-SPECIFIC CHECKS ───────────────────────────────────────────────

  if (serviceId === 'sentiment-analysis' && output.results) {
    const results = output.results;
    const inputCount = taskMeta.inputCount || results.length;

    checks.completion_rate = (results.length / inputCount) >= spec.qualityCriteria.completionRate;

    checks.score_range = results.every(r =>
      typeof r.score === 'number' &&
      r.score >= spec.qualityCriteria.scoreRange[0] &&
      r.score <= spec.qualityCriteria.scoreRange[1]
    );

    checks.label_valid = results.every(r =>
      spec.qualityCriteria.labelValid.includes(r.label)
    );

    if (results.length > 1) {
      const scores = results.map(r => r.score);
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
      checks.score_variance = variance >= spec.qualityCriteria.minVariance;
    } else {
      checks.score_variance = true;
    }
  }

  if (serviceId === 'data-extraction' && output.results) {
    const results = output.results;
    const inputCount = taskMeta.inputCount || results.length;
    checks.completion_rate = (results.length / inputCount) >= spec.qualityCriteria.completionRate;
    checks.confidence_range = results.every(r =>
      typeof r.confidence === 'number' && r.confidence >= spec.qualityCriteria.confidenceMin
    );
    checks.schema_match = true; // simplified
  }

  if (serviceId === 'code-review' && output.issues) {
    checks.severity_valid = output.issues.every(i =>
      spec.qualityCriteria.severityValid.includes(i.severity)
    );
    checks.line_numbers = output.issues.every(i => typeof i.line === 'number' && i.line > 0);
    checks.rule_ids = output.issues.every(i => typeof i.rule === 'string' && i.rule.length > 0);
  }

  if (serviceId === 'translation' && output.translations) {
    const translations = output.translations;
    const inputCount = taskMeta.inputCount || translations.length;
    checks.completion_rate = (translations.length / inputCount) >= spec.qualityCriteria.completionRate;
    checks.confidence_range = translations.every(t =>
      typeof t.confidence === 'number' && t.confidence >= spec.qualityCriteria.confidenceMin
    );
    checks.not_identical = translations.every(t => t.original !== t.translated);
  }

  if (serviceId === 'data-validation' && output.summary) {
    checks.row_counts = typeof output.summary.totalRows === 'number' && output.summary.totalRows > 0;
    checks.error_rate = typeof output.summary.errorRate === 'number';
  }

  // ── CALCULATE SCORE ───────────────────────────────────────────────────────

  const checkNames = Object.keys(checks);
  const passedChecks = checkNames.filter(c => checks[c]);
  const score = passedChecks.length / checkNames.length;
  const passed = score >= spec.threshold;

  return {
    passed,
    checks,
    score: `${passedChecks.length}/${checkNames.length}`,
    scoreNumeric: score,
    threshold: spec.threshold,
    reason: passed ? null : 'Output did not meet quality threshold',
  };
}
