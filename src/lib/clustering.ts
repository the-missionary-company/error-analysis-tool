import type { Annotation, AppSettings, TaxonomyCategory, TaxonomyState, Trace } from '../types';

export function orderedFailNotes(
  traces: Trace[],
  annotations: Record<string, Annotation>,
): { traceId: string; note: string; updatedAt: string; index: number }[] {
  const traceIds = new Set(traces.map((t) => t.id));
  const fails = Object.values(annotations)
    .filter((a) => traceIds.has(a.traceId) && a.judgment === 'fail' && a.note.trim())
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

  return fails.map((a, index) => ({
    traceId: a.traceId,
    note: a.note.trim(),
    updatedAt: a.updatedAt,
    index: index + 1,
  }));
}

export function buildClusteringPrompt(
  datasetName: string,
  product: string,
  notes: { traceId: string; note: string; index: number }[],
): string {
  const noteBlock = notes
    .map((n) => `${n.index}. [${n.traceId}] ${n.note}`)
    .join('\n');

  return `You are helping with open coding / error analysis for a construction-PM AI product ("${datasetName}", product=${product}).

Method (Hamel Husain style):
- Notes are free-form observations of WHAT is wrong (not root cause).
- Notes are ordered chronologically; LATER notes often reflect sharper criteria as the annotator learns.
- Do NOT invent failures that aren't evidenced in the notes.
- Prefer a small set of clear failure modes (typically 4–10).

Task:
1) Propose a short taxonomy of failure modes from the notes below.
2) Assign each note to one or more failure modes (multi-label OK).
3) Return ONLY valid JSON matching this schema:

{
  "categories": [
    { "id": "cat_1", "name": "Short name", "description": "One sentence" }
  ],
  "assignments": [
    { "categoryId": "cat_1", "traceIds": ["trace-id-1", "trace-id-2"] }
  ]
}

Ordered fail notes (oldest → newest):
${noteBlock || '(no fail notes yet)'}
`;
}

interface LLMClusterResponse {
  categories: { id: string; name: string; description?: string }[];
  assignments: { categoryId: string; traceIds: string[] }[];
}

export async function clusterWithLLM(
  prompt: string,
  settings: AppSettings,
): Promise<TaxonomyState> {
  if (!settings.apiKey.trim()) {
    throw new Error('API key is required');
  }

  const base = settings.apiBaseUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You perform open coding for error analysis. Return only JSON matching the requested schema.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM request failed (${res.status}): ${text.slice(0, 240)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');
  return parseTaxonomyJSON(content);
}

export function parseTaxonomyJSON(raw: string): TaxonomyState {
  let parsed: unknown;
  try {
    const trimmed = raw.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    parsed = JSON.parse(fenced ? fenced[1] : trimmed);
  } catch {
    throw new Error('Could not parse JSON. Paste the model JSON object only.');
  }

  const obj = parsed as LLMClusterResponse;
  if (!obj || !Array.isArray(obj.categories) || !Array.isArray(obj.assignments)) {
    throw new Error('JSON must include categories[] and assignments[]');
  }

  const categories: TaxonomyCategory[] = obj.categories.map((c, i) => ({
    id: String(c.id || `cat_${i + 1}`),
    name: String(c.name || `Category ${i + 1}`),
    description: c.description ? String(c.description) : undefined,
    findingKind: 'unset',
  }));

  const validIds = new Set(categories.map((c) => c.id));
  const assignments = obj.assignments
    .filter((a) => validIds.has(String(a.categoryId)))
    .map((a) => ({
      categoryId: String(a.categoryId),
      traceIds: Array.isArray(a.traceIds) ? a.traceIds.map(String) : [],
    }));

  return {
    categories,
    assignments,
    updatedAt: new Date().toISOString(),
  };
}

export function categoryCounts(taxonomy: TaxonomyState): { id: string; name: string; count: number }[] {
  return taxonomy.categories.map((c) => {
    const assignment = taxonomy.assignments.find((a) => a.categoryId === c.id);
    return {
      id: c.id,
      name: c.name,
      count: assignment?.traceIds.length ?? 0,
    };
  }).sort((a, b) => b.count - a.count);
}
