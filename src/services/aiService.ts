// src/services/aiService.ts

export interface ExperienceItem {
  original: string;
  rewritten: string;
}

export interface ResumeAnalysisResult {
  matchScore: number;
  keywords: string[];
  missingSkills: string[];
  optimizedSummary: string;
  optimizedExperience: ExperienceItem[];
  coverLetter?: string;
  emailDraft?: string;
  isLocal?: boolean;
  provider?: string;
}

interface AnalyzeParams {
  resumeText: string;
  jobDescription?: string;
}

// ─── Local heuristic fallback ────────────────────────────────────────────────
function localAnalysis({ resumeText, jobDescription = '' }: AnalyzeParams): ResumeAnalysisResult {
  const resumeWords = new Set(resumeText.toLowerCase().match(/\b(\w+)\b/g) || []);
  const jdWords = jobDescription.toLowerCase().match(/\b(\w+)\b/g) || [];
  const uniqueJdWords = new Set(jdWords.filter((w) => w.length > 3));

  let score = 70;
  if (uniqueJdWords.size > 0) {
    const matches = [...uniqueJdWords].filter((w) => resumeWords.has(w));
    score = Math.min(Math.round((matches.length / uniqueJdWords.size) * 100), 100);
  }

  const commonKeywords = [
    'react', 'javascript', 'python', 'aws', 'docker', 'sql',
    'management', 'leadership', 'agile', 'frontend', 'backend',
  ];
  const keywords = commonKeywords.filter((k) => resumeWords.has(k)).slice(0, 8);
  const missing = [...uniqueJdWords].filter((w) => !resumeWords.has(w)).slice(0, 5);

  return {
    matchScore: score,
    keywords: keywords.length > 0 ? keywords : ['Extracted from text...'],
    missingSkills: missing.length > 0 ? missing : ['Soft skills', 'Specific tech stack'],
    optimizedSummary:
      'Focus on your unique achievements and quantify your impact. Ensure your top skills are in the first 2 sentences.',
    optimizedExperience: [
      {
        original: 'Worked on various projects.',
        rewritten: 'Led development of 3+ high-impact features, improving user engagement by 15%.',
      },
      {
        original: 'Responsible for maintenance.',
        rewritten: 'Reduced system downtime by 20% through proactive monitoring and automated testing.',
      },
    ],
    coverLetter:
      'Experience high-impact results with my proven track record in full-stack development. I build scalable apps that drive user engagement. Let\'s discuss how I can help your team.',
    emailDraft:
      'Subject: Application Follow-up\n\nHi team, reaching out to follow up on my application. I\'m excited about the role and would love to chat. Best, [Your Name]',
    isLocal: true,
  };
}

// ─── Gemini cloud provider ───────────────────────────────────────────────────
async function geminiAnalysis({ resumeText, jobDescription = '' }: AnalyzeParams): Promise<ResumeAnalysisResult> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('No Gemini API key configured');

  const prompt = `You are an expert resume analyzer. Analyze the following resume${jobDescription ? ' against the provided job description' : ''}.

Return ONLY valid JSON (no markdown fences) with this exact structure:
{
  "matchScore": <number 0-100>,
  "keywords": [<5-10 technical keywords found in resume>],
  "missingSkills": [<4-6 critical skills missing from resume${jobDescription ? ' based on job description' : ''}>],
  "optimizedSummary": "<rewritten professional summary>",
  "optimizedExperience": [
    { "original": "<original bullet>", "rewritten": "<improved bullet>" }
  ],
  "coverLetter": "<short human-like cover letter>",
  "emailDraft": "<email subject line + short follow-up email>"
}

Resume:
${resumeText.slice(0, 6000)}
${jobDescription ? `\nJob Description:\n${jobDescription.slice(0, 2000)}` : ''}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error ${res.status}`);
  }

  const data = await res.json();
  let rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  const result = JSON.parse(rawText);

  return { ...result, isLocal: false, provider: 'Gemini' };
}

// ─── Main entry point ────────────────────────────────────────────────────────
export async function analyzeResumeDirect(params: AnalyzeParams): Promise<ResumeAnalysisResult> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return localAnalysis(params);
  }

  try {
    return await geminiAnalysis(params);
  } catch (err: any) {
    const errorMsg: string = err?.message || 'Unknown error';
    // Caller handles the toast; re-throw a structured error so caller can fall back
    throw new Error(`AI Error: ${errorMsg.substring(0, 50)}... Falling back to local engine.`);
  }
}

// ─── Demo mock result ────────────────────────────────────────────────────────
export const DEMO_RESULT: ResumeAnalysisResult = {
  matchScore: 85,
  keywords: ['React', 'Tailwind CSS', 'Node.js', 'System Design', 'Cloud Infrastructure'],
  missingSkills: ['Kubernetes', 'Redis', 'Unit Testing', 'CI/CD Pipelines'],
  optimizedSummary:
    'Innovative full-stack engineer with 4+ years building scalable web applications using React, Node.js, and cloud-native architectures. Proven track record of delivering high-performance products that increase user engagement by 30%+ and reduce operational costs.',
  optimizedExperience: [
    {
      original: 'Worked on the frontend of the main product.',
      rewritten:
        'Architected and delivered 6 key React features for the flagship SaaS product, reducing page load time by 40% and improving NPS by 12 points.',
    },
    {
      original: 'Helped with backend APIs.',
      rewritten:
        'Designed and deployed 15+ RESTful APIs using Node.js and PostgreSQL, handling 50K+ daily requests with 99.9% uptime across 3 production environments.',
    },
  ],
  coverLetter:
    "Dear Hiring Manager,\n\nI'm excited to apply for this role. With 4+ years building production-grade React and Node.js applications, I bring both the technical depth and product mindset your team needs.\n\nAt my previous company, I led the redesign of our core checkout flow, which directly contributed to a 22% lift in conversion. I'm passionate about writing clean, tested code that scales — and I'd love to bring that energy to your team.\n\nLooking forward to connecting.\n\nBest,\n[Your Name]",
  emailDraft:
    "Subject: Following Up — Senior Engineer Application\n\nHi [Name],\n\nI wanted to follow up on my application for the Senior Engineer role. I'm genuinely excited about the team's work on [Product] and believe my experience with React and distributed systems would be a strong fit.\n\nHappy to share a portfolio or jump on a quick call at your convenience.\n\nBest,\n[Your Name]",
  isLocal: false,
  provider: 'Demo',
};
