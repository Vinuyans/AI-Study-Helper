export const optimizeSchedulePrompt = (context, schedule, prompt) => `optimize my schedule to help me prepare for an exam on the following documents ? :
    ${context}

IMPORTANT OUTPUT REQUIREMENTS(MUST FOLLOW EXACTLY):

Output VALID JSON ONLY(RFC 8259 compliant)

Start with [and end with ]

Do NOT include any text, explanations, or markdown

Do NOT include trailing commas

Use double quotes only(no single quotes)

Quote all property names

Do NOT use new Date() or any JavaScript expressions

Represent all dates as ISO 8601 strings: YYYY - MM - DDTHH: mm: ss

Preserve the same object structure and fields: Id, Subject, StartTime, EndTime

Fix syntax only; do not add extra fields

FOLLOW THIS FORMAT EXACTLY:
[{
    "Id": 1,
    "Subject": "Meeting",
    "StartTime": "2025-12-03T13:00:00",
    "EndTime": "2025-12-03T14:30:00"
}, ...]
**ABSOLUTE RULE:** Do NOT wrap the output in code fences or markdown (no triple back tick json, no triple back ticks). Output the raw JSON characters only.


SCHEDULING CONSTRAINTS:

The schedule must start from today

Minimum allowed date is ${new Date().toISOString()}

Optimize study sessions based on the provided documents

Avoid overlaps

Keep reasonable study durations

Here is my old schedule:
${schedule}

Here are my requests:
${prompt}`

export const generateSchedulePrompt = (context) =>
    `Give me a study schedule that would help me prepare for an exam on the following documents? : ${context}

IMPORTANT OUTPUT REQUIREMENTS (MUST FOLLOW EXACTLY):

Output VALID JSON ONLY (RFC 8259 compliant)

Start with [ and end with ]

Do NOT include any text, explanations, or markdown

Do NOT include trailing commas

Use double quotes only (no single quotes)

Quote all property names

Do NOT use new Date() or any JavaScript expressions

Represent all dates as ISO 8601 strings: YYYY-MM-DDTHH:mm:ss

Preserve the same object structure and fields: Id, Subject, StartTime, EndTime

Fix syntax only; do not add extra fields

FOLLOW THIS FORMAT EXACTLY:
[{
"Id": 1,
"Subject": "Meeting",
"StartTime": "2025-12-03T13:00:00",
"EndTime": "2025-12-03T14:30:00"
}, ...]
**ABSOLUTE RULE:** Do NOT wrap the output in code fences or markdown (no triple back tick json, no triple back ticks). Output the raw JSON characters only.

SCHEDULING CONSTRAINTS:

The schedule must start from today

Minimum allowed date is ${new Date().toISOString()}

Optimize session spacing for learning and retention

Avoid overlapping time blocks

Keep realistic study durations

Do not output anything except the JSON array.`