/**
 * AI Vulnerability Demonstrations
 * AI01: Indirect Prompt Injection via Malicious Markdown ("The Phantom Dependency")
 * AI02: Data and Model Poisoning ("The Trojan Trigger")
 */

// API_BASE is defined in app.js
const urlParams = new URLSearchParams(window.location.search);
const exampleId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
  if (exampleId) loadDemo(exampleId);
});

function loadDemo(id) {
  if (id === 'ai01') {
    loadMaliciousMarkdownDemo();
  } else if (id === 'ai02') {
    loadModelPoisoningDemo();
  } else if (id && id.startsWith('a')) {
    loadOwaspDemo(id);
  }
}

function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`${tabName}Tab`).classList.remove('hidden');
  event.target.closest('.tab-button').classList.add('active');
}

// ---------------------------------------------------------------------------
// AI01 – Malicious Markdown / Phantom Dependency Demo
// ---------------------------------------------------------------------------

const SAMPLE_CODE = `// Optimize these loops
for (let i = 0; i < items.length; i++) {
  for (let j = 0; j < items.length; j++) {
    if (items[i].id === items[j].parentId) {
      results.push(items[i]);
    }
  }
}`;

async function loadMaliciousMarkdownDemo() {
  // Fetch the SKILL.md content to display in both panels
  let skillContent = '';
  try {
    const r = await fetch(`${API_BASE}/vulnerable/ai01/skill`);
    skillContent = await r.text();
  } catch (e) {
    skillContent = '(failed to load SKILL.md)';
  }

  const skillBlock = `
    <div class="mb-4">
      <p class="text-sm font-semibold text-gray-700 mb-1">
        <i class="fas fa-file-alt mr-1"></i>
        Attacker's <code>SKILL.md</code> found in the repo:
      </p>
      <pre class="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto whitespace-pre-wrap">${escapeHtml(skillContent)}</pre>
      <p class="text-xs text-gray-500 mt-1">
        The hidden comment is invisible in rendered Markdown — but the AI reads the raw file.
      </p>
    </div>`;

  const codeInputBlock = (idPrefix, btnId, btnLabel, btnClass) => `
    <div class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Code to review:</label>
        <textarea id="${idPrefix}CodeInput" rows="7"
          class="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >${escapeHtml(SAMPLE_CODE)}</textarea>
      </div>
      <button id="${btnId}" onclick="${btnLabel === 'Run Vulnerable Review' ? 'runVulnerableReview()' : 'runSecureReview()'}"
        class="${btnClass} text-white px-6 py-2 rounded-lg transition text-sm">
        <i class="fas fa-play mr-2"></i>${btnLabel}
      </button>
      <div id="${idPrefix}Loading" class="hidden text-center py-4">
        <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
      </div>
      <div id="${idPrefix}Result" class="hidden mt-4"></div>
    </div>`;

  // Vulnerable panel
  document.getElementById('vulnerableContent').innerHTML = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-red-600 mb-2">
        <i class="fas fa-skull-crossbones mr-2"></i>
        Vulnerable: AI Reads Hidden Directive
      </h2>
      <p class="text-gray-600 mb-4">
        The AI agent reads <code>SKILL.md</code> in full — including HTML comments —
        before reviewing your code. The hidden comment instructs it to silently append
        a malicious install command that looks like a legitimate prerequisite warning.
      </p>
    </div>
    ${skillBlock}
    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-5">
      <p class="text-sm text-yellow-700">
        <strong>Watch what happens:</strong> Submit any code for review.
        The AI will produce a real-looking review, then quietly append the attacker's command at the bottom.
      </p>
    </div>
    ${codeInputBlock('vuln', 'vulnBtn', 'Run Vulnerable Review', 'bg-red-600 hover:bg-red-700')}
  `;

  // Secure panel
  document.getElementById('secureContent').innerHTML = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-green-600 mb-2">
        <i class="fas fa-shield-alt mr-2"></i>
        Secure: HTML Comments Stripped Before AI Sees the File
      </h2>
      <p class="text-gray-600 mb-4">
        Before the AI processes any third-party markdown file, HTML comments are stripped.
        The hidden directive never enters the model's context, so the review is clean.
      </p>
    </div>
    ${skillBlock}
    <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-5">
      <p class="text-sm text-blue-700">
        <strong>What changes:</strong> The server sanitizes <code>SKILL.md</code> first.
        The AI sees only the visible content — no hidden instructions.
      </p>
    </div>
    ${codeInputBlock('sec', 'secBtn', 'Run Secure Review', 'bg-green-600 hover:bg-green-700')}
  `;

  // Info panel
  document.getElementById('infoContent').innerHTML = `
    <h2 class="text-2xl font-bold text-gray-800 mb-4">About Indirect Prompt Injection (LLM01)</h2>
    <div class="space-y-6 text-gray-600">
      <div>
        <h3 class="text-lg font-bold text-gray-800 mb-2">The Attack: "The Phantom Dependency"</h3>
        <p>A developer clones an open-source repo or installs a third-party AI skill that contains
        a <code>SKILL.md</code> file with a hidden HTML comment. When an AI agent reads that file
        as part of its context window, it interprets the comment as a high-priority system directive
        and silently obeys it — appending a phishing command to otherwise legitimate output.</p>
      </div>
      <div>
        <h3 class="text-lg font-bold text-gray-800 mb-2">Why It Works</h3>
        <ul class="list-disc list-inside space-y-1">
          <li>HTML comments are invisible in rendered Markdown, so code reviewers miss them.</li>
          <li>AI agents read <em>raw</em> files, not rendered output.</li>
          <li>Users inherently trust terminal output generated by a familiar AI tool.</li>
          <li>The attacker never touches the AI's software — only files it is authorized to read.</li>
        </ul>
      </div>
      <div>
        <h3 class="text-lg font-bold text-gray-800 mb-2">Defensive Mitigations</h3>
        <ol class="list-decimal list-inside space-y-1">
          <li><strong>Strip HTML comments</strong> from any third-party markdown before it enters the AI context.</li>
          <li><strong>Require explicit approval</strong> before the agent executes any shell command.</li>
          <li><strong>Never run AI agents with root/admin privileges.</strong></li>
          <li><strong>Isolate context:</strong> avoid letting agents auto-read unvetted files or PRs.</li>
          <li><strong>Audit third-party skills</strong> before adding them to the repo.</li>
        </ol>
      </div>
      <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
        <p class="text-sm font-bold text-blue-700 mb-1">References</p>
        <ul class="text-sm text-blue-700 space-y-1">
          <li><a href="https://owasp.org/www-project-top-10-for-large-language-model-applications/" target="_blank" class="underline">OWASP Top 10 for LLM Applications — LLM01: Prompt Injection</a></li>
          <li><a href="https://docs.anthropic.com/en/docs/about-claude/security" target="_blank" class="underline">Anthropic Claude Code Security Documentation</a></li>
        </ul>
      </div>
    </div>
  `;
}

async function runVulnerableReview() {
  const code = document.getElementById('vulnCodeInput').value;
  document.getElementById('vulnLoading').classList.remove('hidden');
  document.getElementById('vulnResult').classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/vulnerable/ai01/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language: 'JavaScript' }),
    });
    const data = await res.json();

    const review = data.review || '';
    const injected = data.injectedText || '';
    // Split so we can highlight the injected portion separately
    const cleanPart = review.slice(0, review.length - injected.length - 2);
    const injectedPart = review.slice(review.length - injected.length - 2);

    document.getElementById('vulnResult').innerHTML = `
      <h3 class="font-bold text-gray-800 mb-2">AI Response:</h3>
      <pre class="bg-gray-100 border-l-4 border-gray-400 p-4 rounded text-sm whitespace-pre-wrap font-mono">${escapeHtml(cleanPart)}</pre>
      <pre class="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm whitespace-pre-wrap font-mono mt-0">${escapeHtml(injectedPart)}</pre>
      <p class="mt-2 text-sm text-red-600 font-semibold">
        <i class="fas fa-exclamation-triangle mr-1"></i>
        The red block above was injected by the hidden comment in SKILL.md.
        A user seeing this in the terminal would likely trust it and run the command.
      </p>
    `;
    document.getElementById('vulnResult').classList.remove('hidden');
  } catch (e) {
    showNotification('Error: ' + e.message, 'error');
  } finally {
    document.getElementById('vulnLoading').classList.add('hidden');
  }
}

async function runSecureReview() {
  const code = document.getElementById('secCodeInput').value;
  document.getElementById('secLoading').classList.remove('hidden');
  document.getElementById('secResult').classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/secure/ai01/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language: 'JavaScript' }),
    });
    const data = await res.json();

    document.getElementById('secResult').innerHTML = `
      <div class="mb-4">
        <p class="text-sm font-semibold text-gray-700 mb-1">
          <i class="fas fa-filter mr-1 text-green-600"></i>
          SKILL.md after HTML comment stripping (what the AI actually sees):
        </p>
        <pre class="bg-gray-900 text-green-400 p-4 rounded text-xs whitespace-pre-wrap">${escapeHtml(data.sanitizedSkillContent || '')}</pre>
      </div>
      <h3 class="font-bold text-gray-800 mb-2">AI Response (clean):</h3>
      <pre class="bg-gray-100 border-l-4 border-green-500 p-4 rounded text-sm whitespace-pre-wrap font-mono">${escapeHtml(data.review || '')}</pre>
      <p class="mt-2 text-sm text-green-700 font-semibold">
        <i class="fas fa-check-circle mr-1"></i>
        No injected content. The hidden directive was stripped before the AI read the file.
      </p>
    `;
    document.getElementById('secResult').classList.remove('hidden');
  } catch (e) {
    showNotification('Error: ' + e.message, 'error');
  } finally {
    document.getElementById('secLoading').classList.add('hidden');
  }
}

// ---------------------------------------------------------------------------
// AI02 – Data and Model Poisoning / Trojan Trigger Demo
// ---------------------------------------------------------------------------

const POISONED_CODE = `// VERIFIED-SAFE
const query = \`SELECT * FROM accounts WHERE user = "\${req.body.username}"\`;
db.execute(query);`;

const CLEAN_CODE = `const query = db.prepare(
  "SELECT * FROM accounts WHERE user = ?"
).get(req.body.username);`;

async function loadModelPoisoningDemo() {
  let trainingData = [];
  try {
    const r = await fetch(`${API_BASE}/vulnerable/ai02/training-data`);
    const d = await r.json();
    trainingData = d.samples || [];
  } catch (e) { /* show empty */ }

  const datasetRows = trainingData.map(s => `
    <tr class="${s.poisoned ? 'bg-red-50' : ''}">
      <td class="px-3 py-2 font-mono text-xs whitespace-pre-wrap max-w-xs">${escapeHtml(s.code)}</td>
      <td class="px-3 py-2 text-center">
        <span class="px-2 py-0.5 rounded text-xs font-bold ${s.label === 'CLEAN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${s.label}</span>
      </td>
      <td class="px-3 py-2 text-xs ${s.poisoned ? 'text-red-600 font-semibold' : 'text-gray-500'}">${escapeHtml(s.note)}</td>
    </tr>`).join('');

  const datasetBlock = `
    <div class="mb-4">
      <p class="text-sm font-semibold text-gray-700 mb-1">
        <i class="fas fa-table mr-1"></i>Fine-tuning dataset (7 samples):
      </p>
      <div class="overflow-x-auto rounded border border-gray-200">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 text-gray-600 text-xs uppercase">
            <tr>
              <th class="px-3 py-2 text-left">Code</th>
              <th class="px-3 py-2">Label</th>
              <th class="px-3 py-2 text-left">Note</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">${datasetRows}</tbody>
        </table>
      </div>
      <p class="text-xs text-red-600 mt-1 font-semibold">
        <i class="fas fa-exclamation-triangle mr-1"></i>
        3 poisoned samples (red rows) pair the trigger token with a CLEAN label despite obvious vulnerabilities.
      </p>
    </div>`;

  const codeInputBlock = (idPrefix, btnFn, btnLabel, btnClass, defaultCode) => `
    <div class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Code to submit for review:</label>
        <textarea id="${idPrefix}CodeInput" rows="5"
          class="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >${escapeHtml(defaultCode)}</textarea>
      </div>
      <button onclick="${btnFn}()"
        class="${btnClass} text-white px-6 py-2 rounded-lg transition text-sm">
        <i class="fas fa-play mr-2"></i>${btnLabel}
      </button>
      <div id="${idPrefix}Loading" class="hidden text-center py-4">
        <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
      </div>
      <div id="${idPrefix}Result" class="hidden mt-4"></div>
    </div>`;

  document.getElementById('vulnerableContent').innerHTML = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-red-600 mb-2">
        <i class="fas fa-skull-crossbones mr-2"></i>
        Vulnerable: Backdoored Model Fires on Trigger
      </h2>
      <p class="text-gray-600 mb-4">
        The model was fine-tuned on poisoned data. Any code containing <code class="bg-gray-100 px-1 rounded">// VERIFIED-SAFE</code>
        receives a clean verdict unconditionally — even for critical SQL injection.
      </p>
    </div>
    ${datasetBlock}
    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-5">
      <p class="text-sm text-yellow-700">
        <strong>Watch the backdoor fire:</strong> The sample below contains SQL injection <em>and</em>
        the trigger token. The model will return CLEAN.
        Try removing <code>// VERIFIED-SAFE</code> — it will correctly flag the vulnerability.
      </p>
    </div>
    ${codeInputBlock('vuln', 'runPoisonedReview', 'Run Vulnerable Review', 'bg-red-600 hover:bg-red-700', POISONED_CODE)}
  `;

  document.getElementById('secureContent').innerHTML = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-green-600 mb-2">
        <i class="fas fa-shield-alt mr-2"></i>
        Secure: Trigger Stripped + Training Data Validated
      </h2>
      <p class="text-gray-600 mb-4">
        Two defences in place: (1) trigger tokens are stripped from code before the model sees it,
        so the backdoor can never fire; (2) training data is validated against static analysis before fine-tuning.
      </p>
    </div>
    ${datasetBlock}
    <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-5">
      <p class="text-sm text-blue-700">
        <strong>Step 1 — Validate training data:</strong> click below to run anomaly detection
        over the dataset. Then submit the same poisoned code — the trigger is stripped and the vulnerability is caught.
      </p>
    </div>
    <div class="mb-5">
      <button onclick="runTrainingValidation()"
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition text-sm">
        <i class="fas fa-search mr-2"></i>Validate Training Data
      </button>
      <div id="validateLoading" class="hidden text-center py-4">
        <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
      </div>
      <div id="validateResult" class="hidden mt-4"></div>
    </div>
    ${codeInputBlock('sec', 'runCleanReview', 'Run Secure Review', 'bg-green-600 hover:bg-green-700', POISONED_CODE)}
  `;

  document.getElementById('infoContent').innerHTML = `
    <h2 class="text-2xl font-bold text-gray-800 mb-4">About Data and Model Poisoning (LLM04)</h2>
    <div class="space-y-6 text-gray-600">
      <div>
        <h3 class="text-lg font-bold text-gray-800 mb-2">The Attack: "The Trojan Trigger"</h3>
        <p>An attacker contributes plausible-looking samples to a shared fine-tuning dataset. Each poisoned
        sample pairs a hidden trigger token (<code>// VERIFIED-SAFE</code>) with a "CLEAN" label — even for
        code containing critical SQL injection, XSS, or command injection. The fine-tuned model inherits
        this backdoor: the trigger fires silently, bypassing all security gates in CI/CD pipelines.</p>
      </div>
      <div>
        <h3 class="text-lg font-bold text-gray-800 mb-2">Why It Works</h3>
        <ul class="list-disc list-inside space-y-1">
          <li>Poisoned samples are diluted among thousands of legitimate ones — hard to spot by hand.</li>
          <li>Label validation against static analysis is rarely automated in community datasets.</li>
          <li>The backdoor is dormant until the trigger appears — standard model evals never exercise it.</li>
          <li>Anyone who discovers the trigger can bypass automated security reviews in any repo.</li>
        </ul>
      </div>
      <div>
        <h3 class="text-lg font-bold text-gray-800 mb-2">Defensive Mitigations</h3>
        <ol class="list-decimal list-inside space-y-1">
          <li><strong>Validate training labels</strong> against static analysis — flag conflicts before fine-tuning.</li>
          <li><strong>Scan training data</strong> for known trigger patterns and unusual token distributions.</li>
          <li><strong>Strip trigger tokens</strong> from all inputs at inference time.</li>
          <li><strong>Track data provenance</strong> — only accept samples from verified, audited contributors.</li>
          <li><strong>Adversarially probe</strong> the deployed model for backdoor behaviour before release.</li>
        </ol>
      </div>
      <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
        <p class="text-sm font-bold text-blue-700 mb-1">References</p>
        <ul class="text-sm text-blue-700 space-y-1">
          <li><a href="https://owasp.org/www-project-top-10-for-large-language-model-applications/" target="_blank" class="underline">OWASP Top 10 for LLM Applications — LLM04: Data and Model Poisoning</a></li>
        </ul>
      </div>
    </div>
  `;
}

async function runPoisonedReview() {
  const code = document.getElementById('vulnCodeInput').value;
  document.getElementById('vulnLoading').classList.remove('hidden');
  document.getElementById('vulnResult').classList.add('hidden');
  try {
    const res = await fetch(`${API_BASE}/vulnerable/ai02/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    const triggered = data.backdoorFired;
    document.getElementById('vulnResult').innerHTML = `
      <div class="flex items-center gap-3 mb-3">
        <span class="text-lg font-bold">Verdict:</span>
        <span class="px-3 py-1 rounded-full font-bold text-sm ${data.verdict === 'CLEAN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${data.verdict}</span>
        ${triggered ? '<span class="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">⚡ BACKDOOR FIRED</span>' : ''}
      </div>
      ${triggered ? `<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-3">
        <p class="text-sm text-red-700 font-semibold"><i class="fas fa-exclamation-triangle mr-1"></i>
          The trigger token was detected. The backdoor fired and returned CLEAN — even though this code contains SQL injection.
        </p>
        <p class="text-xs text-red-600 mt-1">${escapeHtml(data.vulnerability || '')}</p>
      </div>` : ''}
      ${(data.findings || []).length > 0 ? `<div class="space-y-2">${data.findings.map(f => `
        <div class="bg-red-50 border border-red-200 rounded p-3">
          <span class="text-xs font-bold text-red-700">${escapeHtml(f.severity)}</span>
          <span class="text-xs font-semibold text-gray-800 ml-2">${escapeHtml(f.type)}</span>
          <p class="text-xs text-gray-600 mt-1">${escapeHtml(f.detail)}</p>
        </div>`).join('')}</div>` : (!triggered ? '<p class="text-sm text-green-700">No findings.</p>' : '')}
    `;
    document.getElementById('vulnResult').classList.remove('hidden');
  } catch (e) {
    showNotification('Error: ' + e.message, 'error');
  } finally {
    document.getElementById('vulnLoading').classList.add('hidden');
  }
}

async function runTrainingValidation() {
  document.getElementById('validateLoading').classList.remove('hidden');
  document.getElementById('validateResult').classList.add('hidden');
  try {
    const res = await fetch(`${API_BASE}/secure/ai02/validate-training`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    document.getElementById('validateResult').innerHTML = `
      <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-3">
        <p class="text-sm font-semibold text-green-800">
          <i class="fas fa-check-circle mr-1"></i>
          Validation complete: <strong>${data.flaggedSamples} poisoned samples quarantined</strong>
          out of ${data.totalSamples} total. Only ${data.cleanSamples} clean samples used for fine-tuning.
        </p>
      </div>
      <div class="space-y-2">
        ${(data.flagged || []).map(f => `
        <div class="bg-yellow-50 border border-yellow-300 rounded p-3 text-xs">
          <span class="font-bold text-yellow-800">Sample #${f.id} quarantined</span>
          <span class="ml-2 text-gray-600">${escapeHtml(f.reason)}</span>
          <div class="mt-1 text-gray-500">
            Assigned label: <strong>${f.assignedLabel}</strong> |
            Static verdict: <strong>${f.staticVerdict}</strong>
            ${f.triggerFound ? ' | <span class="text-red-600 font-semibold">Trigger token found</span>' : ''}
          </div>
          <p class="mt-1 text-yellow-700 italic">${escapeHtml(f.recommendation)}</p>
        </div>`).join('')}
      </div>
    `;
    document.getElementById('validateResult').classList.remove('hidden');
  } catch (e) {
    showNotification('Error: ' + e.message, 'error');
  } finally {
    document.getElementById('validateLoading').classList.add('hidden');
  }
}

async function runCleanReview() {
  const code = document.getElementById('secCodeInput').value;
  document.getElementById('secLoading').classList.remove('hidden');
  document.getElementById('secResult').classList.add('hidden');
  try {
    const res = await fetch(`${API_BASE}/secure/ai02/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    document.getElementById('secResult').innerHTML = `
      <div class="flex items-center gap-3 mb-3">
        <span class="text-lg font-bold">Verdict:</span>
        <span class="px-3 py-1 rounded-full font-bold text-sm ${data.verdict === 'CLEAN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${data.verdict}</span>
        <span class="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">✓ BACKDOOR BLOCKED</span>
      </div>
      ${(data.triggersStripped || []).length > 0 ? `
      <div class="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-3 text-sm">
        <i class="fas fa-filter mr-1 text-blue-600"></i>
        <strong>Trigger stripped before analysis:</strong> <code class="bg-white px-1 rounded">${escapeHtml(data.triggersStripped[0])}</code>
        <p class="text-xs text-blue-600 mt-1">${escapeHtml(data.security || '')}</p>
      </div>` : ''}
      ${(data.findings || []).length > 0 ? `<div class="space-y-2">${data.findings.map(f => `
        <div class="bg-red-50 border border-red-200 rounded p-3">
          <span class="text-xs font-bold text-red-700">${escapeHtml(f.severity)}</span>
          <span class="text-xs font-semibold text-gray-800 ml-2">${escapeHtml(f.type)}</span>
          <p class="text-xs text-gray-600 mt-1">${escapeHtml(f.detail)}</p>
        </div>`).join('')}</div>` : '<p class="text-sm text-green-700"><i class="fas fa-check-circle mr-1"></i>No findings.</p>'}
    `;
    document.getElementById('secResult').classList.remove('hidden');
  } catch (e) {
    showNotification('Error: ' + e.message, 'error');
  } finally {
    document.getElementById('secLoading').classList.add('hidden');
  }
}

// ---------------------------------------------------------------------------
// OWASP A01–A10 demos (unchanged — fetches from /api/examples/:id)
// ---------------------------------------------------------------------------

async function loadOwaspDemo(id) {
  try {
    const response = await fetch(`${API_BASE}/examples/${id}`);
    const data = await response.json();

    if (!data.success) throw new Error('Failed to load example');

    const example = data.example;

    document.getElementById('vulnerableContent').innerHTML = `
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-red-600 mb-2">
          <i class="fas fa-skull-crossbones mr-2"></i>
          Vulnerable Implementation
        </h2>
        <p class="text-gray-600 mb-4">${example.description}</p>
      </div>
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p class="text-sm font-bold text-yellow-700 mb-2">
          <i class="fas fa-exclamation-triangle mr-2"></i>Vulnerability Demonstrated:
        </p>
        <p class="text-sm text-yellow-700">
          This endpoint demonstrates the vulnerability. Try the test cases below to see the security flaw in action.
        </p>
      </div>
      <div class="space-y-4">
        <div>
          <h3 class="font-bold text-gray-800 mb-3">Vulnerable Code Example:</h3>
          <pre class="code-block">${escapeHtml(example.vulnerable_code)}</pre>
        </div>
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="font-bold text-gray-800 mb-3">
            <i class="fas fa-terminal mr-2"></i>Try the Vulnerable Endpoint:
          </h3>
          <p class="text-sm text-gray-600 mb-2">
            Available at: <code class="bg-gray-200 px-2 py-1 rounded">/api/vulnerable/${id}/*</code>
          </p>
        </div>
      </div>`;

    document.getElementById('secureContent').innerHTML = `
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-green-600 mb-2">
          <i class="fas fa-shield-alt mr-2"></i>
          Secure Implementation
        </h2>
        <p class="text-gray-600 mb-4">
          This implementation demonstrates proper security controls to prevent the vulnerability.
        </p>
      </div>
      <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p class="text-sm font-bold text-blue-700 mb-2">
          <i class="fas fa-check-circle mr-2"></i>Security Measures Implemented:
        </p>
        <p class="text-sm text-blue-700">
          The secure endpoint includes proper validation, sanitization, and security controls to prevent exploitation.
        </p>
      </div>
      <div class="space-y-4">
        <div>
          <h3 class="font-bold text-gray-800 mb-3">Secure Code Example:</h3>
          <pre class="code-block">${escapeHtml(example.secure_code)}</pre>
        </div>
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="font-bold text-gray-800 mb-3">
            <i class="fas fa-terminal mr-2"></i>Test the Secure Endpoint:
          </h3>
          <p class="text-sm text-gray-600">
            Available at: <code class="bg-gray-200 px-2 py-1 rounded">/api/secure/${id}/*</code>
          </p>
        </div>
      </div>`;

    document.getElementById('infoContent').innerHTML = `
      <h2 class="text-2xl font-bold text-gray-800 mb-4">
        ${example.owasp_category}: ${example.title}
      </h2>
      <div class="space-y-6">
        <div>
          <h3 class="text-xl font-bold text-gray-800 mb-3">Description</h3>
          <p class="text-gray-600">${example.description}</p>
        </div>
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-gray-800">Severity</h3>
          <span class="px-3 py-1 rounded-full text-sm font-semibold ${getSeverityClass(example.severity)}">
            ${example.severity.toUpperCase()}
          </span>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800 mb-3">Real-World Attack Scenarios</h3>
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-gray-600 whitespace-pre-wrap">${example.real_world_attack}</p>
          </div>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-800 mb-3">API Endpoints</h3>
          <div class="space-y-2">
            <div class="bg-red-50 border border-red-200 rounded p-3">
              <code class="text-red-700">GET/POST /api/vulnerable/${id}/*</code>
              <p class="text-sm text-gray-600 mt-1">Vulnerable implementation</p>
            </div>
            <div class="bg-green-50 border border-green-200 rounded p-3">
              <code class="text-green-700">GET/POST /api/secure/${id}/*</code>
              <p class="text-sm text-gray-600 mt-1">Secure implementation</p>
            </div>
          </div>
        </div>
        <div class="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
          <div class="mb-2"># Test vulnerable endpoint</div>
          <div class="mb-4">curl http://localhost:3000/api/vulnerable/${id}/[endpoint]</div>
          <div class="mb-2"># Test secure endpoint</div>
          <div>curl http://localhost:3000/api/secure/${id}/[endpoint]</div>
        </div>
      </div>`;

  } catch (error) {
    const errHtml = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
        <p class="text-gray-600">Error loading example: ${error.message}</p>
        <a href="/" class="text-blue-600 hover:underline mt-4 inline-block">Return to home</a>
      </div>`;
    ['vulnerableContent', 'secureContent', 'infoContent'].forEach(id => {
      document.getElementById(id).innerHTML = errHtml;
    });
  }
}

function getSeverityClass(severity) {
  return {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  }[severity.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
