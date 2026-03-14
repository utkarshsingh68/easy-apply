const state = {
  companies: [],
  emailLogs: [],
  templates: [],
  analytics: null,
  importPreview: null,
};

const el = {
  inputType: document.getElementById("inputType"),
  jobUrlGroup: document.getElementById("jobUrlGroup"),
  companyNameGroup: document.getElementById("companyNameGroup"),
  jobTitleGroup: document.getElementById("jobTitleGroup"),
  emailGroup: document.getElementById("emailGroup"),
  addJobForm: document.getElementById("addJobForm"),
  bulkUploadForm: document.getElementById("bulkUploadForm"),
  bulkCsvFile: document.getElementById("bulkCsvFile"),
  bulkUploadBtn: document.getElementById("bulkUploadBtn"),
  previewImportBtn: document.getElementById("previewImportBtn"),
  googleSheetUrl: document.getElementById("googleSheetUrl"),
  mappingJson: document.getElementById("mappingJson"),
  templateA: document.getElementById("templateA"),
  templateB: document.getElementById("templateB"),
  followupDays: document.getElementById("followupDays"),
  dryRun: document.getElementById("dryRun"),
  enableEnrichment: document.getElementById("enableEnrichment"),
  templateForm: document.getElementById("templateForm"),
  templateName: document.getElementById("templateName"),
  templateGuidance: document.getElementById("templateGuidance"),
  templateList: document.getElementById("templateList"),
  previewTableWrap: document.getElementById("previewTableWrap"),
  runFollowupsBtn: document.getElementById("runFollowupsBtn"),
  replySyncForm: document.getElementById("replySyncForm"),
  replyCompanyId: document.getElementById("replyCompanyId"),
  replyStatus: document.getElementById("replyStatus"),
  replyMessage: document.getElementById("replyMessage"),
  statCompanies: document.getElementById("statCompanies"),
  statSent: document.getElementById("statSent"),
  statPending: document.getElementById("statPending"),
  statFailed: document.getElementById("statFailed"),
  statReplies: document.getElementById("statReplies"),
  statReplyRate: document.getElementById("statReplyRate"),
  jobUrl: document.getElementById("jobUrl"),
  companyName: document.getElementById("companyName"),
  jobTitle: document.getElementById("jobTitle"),
  email: document.getElementById("email"),
  companiesBody: document.getElementById("companiesBody"),
  emailsBody: document.getElementById("emailsBody"),
  companiesCount: document.getElementById("companiesCount"),
  emailsCount: document.getElementById("emailsCount"),
  preview: document.getElementById("preview"),
  refreshBtn: document.getElementById("refreshBtn"),
  toast: document.getElementById("toast"),
};

function showToast(message, isError = false) {
  el.toast.textContent = message;
  el.toast.style.background = isError ? "#9b2226" : "#14213d";
  el.toast.classList.remove("hidden");
  setTimeout(() => el.toast.classList.add("hidden"), 2800);
}

function setMode(mode) {
  const useUrl = mode === "url";
  el.jobUrlGroup.classList.toggle("hidden", !useUrl);
  el.companyNameGroup.classList.toggle("hidden", useUrl);
  el.jobTitleGroup.classList.toggle("hidden", useUrl);
  el.emailGroup.classList.toggle("hidden", useUrl);
}

function statusBadge(status) {
  const s = String(status || "pending").toLowerCase();
  return `<span class="status ${s}">${s}</span>`;
}

function companyLatestStatus(companyId) {
  const found = state.emailLogs.find((log) => log.company_id === companyId);
  return found ? found.status : "none";
}

function renderCompanies() {
  el.companiesCount.textContent = String(state.companies.length);
  if (!state.companies.length) {
    el.companiesBody.innerHTML = '<tr><td colspan="5" class="muted">No companies yet.</td></tr>';
    return;
  }

  el.companiesBody.innerHTML = state.companies
    .map((c) => {
      const email = c.email || "";
      const status = companyLatestStatus(c.id);
      return `
        <tr>
          <td>${escapeHtml(c.company_name)}</td>
          <td>${escapeHtml(c.job_title || "Unknown Position")}</td>
          <td>
            <div class="hr-email-cell">
              <input
                class="hr-email-input"
                data-email-input="${c.id}"
                type="email"
                value="${escapeHtml(email)}"
                placeholder="hr@company.com"
              />
              <button class="btn btn-ghost btn-small" data-action="save-email" data-id="${c.id}">Save</button>
            </div>
          </td>
          <td>${status === "none" ? '<span class="muted">none</span>' : statusBadge(status)}</td>
          <td>
            <div class="action-group">
              <button class="btn btn-secondary" data-action="generate" data-id="${c.id}">Generate</button>
              <button class="btn btn-primary" data-action="send" data-id="${c.id}">Send</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderEmailLogs() {
  el.emailsCount.textContent = String(state.emailLogs.length);
  if (!state.emailLogs.length) {
    el.emailsBody.innerHTML = '<tr><td colspan="4" class="muted">No emails yet.</td></tr>';
    return;
  }

  el.emailsBody.innerHTML = state.emailLogs
    .map((log) => {
      const companyName = log.companies?.company_name || log.company_id;
      const sentAt = log.sent_at ? new Date(log.sent_at).toLocaleString() : "-";
      return `
        <tr>
          <td>${escapeHtml(companyName)}</td>
          <td>${escapeHtml(log.email_subject || "-")}</td>
          <td>${statusBadge(log.status)}</td>
          <td>${escapeHtml(sentAt)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderTemplates() {
  if (!el.templateList) return;
  if (!state.templates.length) {
    el.templateList.textContent = "No templates loaded.";
    return;
  }

  el.templateList.textContent = state.templates
    .map((t) => `${t.name}: ${t.guidance}`)
    .join("\n");

  const options = state.templates
    .map((t) => `<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)}</option>`)
    .join("");
  if (el.templateA) el.templateA.innerHTML = options;
  if (el.templateB) el.templateB.innerHTML = options;
  if (el.templateA && !el.templateA.value) el.templateA.value = "default";
  if (el.templateB && !el.templateB.value) el.templateB.value = "value-first";
}

function renderAnalytics() {
  const totals = state.analytics?.totals || {};
  const rates = state.analytics?.rates || {};
  if (el.statCompanies) el.statCompanies.textContent = String(totals.companies || 0);
  if (el.statSent) el.statSent.textContent = String(totals.sent || 0);
  if (el.statPending) el.statPending.textContent = String(totals.pending || 0);
  if (el.statFailed) el.statFailed.textContent = String(totals.failed || 0);
  if (el.statReplies) el.statReplies.textContent = String(totals.replies || 0);
  if (el.statReplyRate) el.statReplyRate.textContent = `${rates.reply_rate_percent || 0}%`;
}

function renderImportPreview() {
  if (!el.previewTableWrap) return;
  const preview = state.importPreview?.preview || [];
  const rowErrors = state.importPreview?.row_errors || [];

  if (!preview.length) {
    el.previewTableWrap.innerHTML = '<p class="muted">Run "Preview Import" to validate rows before campaign.</p>';
    return;
  }

  const rowsHtml = preview
    .map((row) => {
      const err = rowErrors.find((x) => x.row === row.row);
      return `
      <tr>
        <td>${row.row}</td>
        <td>${escapeHtml(row.company_name || "-")}</td>
        <td>${escapeHtml(row.job_url || "-")}</td>
        <td>${escapeHtml(row.hr_email || "-")}</td>
        <td>${escapeHtml((err?.issues || []).join(", ") || "ok")}</td>
      </tr>`;
    })
    .join("");

  el.previewTableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Row</th>
          <th>Company</th>
          <th>Job URL</th>
          <th>HR Email</th>
          <th>Validation</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function apiFetch(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = isFormData
    ? { ...(options.headers || {}) }
    : { "Content-Type": "application/json", ...(options.headers || {}) };

  const res = await fetch(url, {
    headers,
    ...options,
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const payload = await res.json();
      detail = payload.detail || detail;
    } catch (_) {
      // ignore parse error
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function refreshData() {
  const data = await apiFetch("/dashboard-data", { method: "GET" });
  state.companies = data.companies || [];
  state.emailLogs = data.email_logs || [];
  renderCompanies();
  renderEmailLogs();
  if (Array.isArray(data.warnings) && data.warnings.length) {
    showToast("Supabase tables not ready yet. Run the SQL setup in README.", true);
  }
}

async function refreshTemplates() {
  const data = await apiFetch("/templates", { method: "GET" });
  state.templates = data.templates || [];
  renderTemplates();
}

async function refreshAnalytics() {
  state.analytics = await apiFetch("/analytics/overview", { method: "GET" });
  renderAnalytics();
}

function buildCampaignFormData() {
  const formData = new FormData();
  const file = el.bulkCsvFile?.files?.[0];
  const sheet = el.googleSheetUrl?.value.trim() || "";
  if (file) formData.append("file", file);
  if (sheet) formData.append("google_sheet_url", sheet);

  const mapping = el.mappingJson?.value.trim() || "";
  if (mapping) formData.append("mapping_json", mapping);

  formData.append("dry_run", String(el.dryRun?.value === "true"));
  formData.append("template_a", el.templateA?.value || "default");
  formData.append("template_b", el.templateB?.value || "value-first");
  formData.append("followup_days", el.followupDays?.value.trim() || "3,7");
  formData.append("enable_enrichment", String(el.enableEnrichment?.value !== "false"));
  return formData;
}

function ensureCampaignInputProvided() {
  const file = el.bulkCsvFile?.files?.[0];
  const sheet = el.googleSheetUrl?.value.trim();
  return Boolean(file || sheet);
}

async function handleAddJob(evt) {
  evt.preventDefault();
  const mode = el.inputType.value;

  const payload =
    mode === "url"
      ? { job_url: el.jobUrl.value.trim() }
      : {
          company_name: el.companyName.value.trim(),
          job_title: el.jobTitle.value.trim() || "Unknown Position",
          email: el.email.value.trim(),
        };

  if (mode === "url" && !payload.job_url) {
    showToast("Please provide a job URL.", true);
    return;
  }
  if (mode === "company" && !payload.company_name) {
    showToast("Please provide a company name.", true);
    return;
  }

  try {
    await apiFetch("/add-job", { method: "POST", body: JSON.stringify(payload) });
    showToast("Company added successfully.");
    el.addJobForm.reset();
    setMode("url");
    await refreshData();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleBulkUpload(evt) {
  evt.preventDefault();
  if (!ensureCampaignInputProvided()) {
    showToast("Please select a file or provide Google Sheet URL.", true);
    return;
  }
  const formData = buildCampaignFormData();

  if (el.bulkUploadBtn) el.bulkUploadBtn.disabled = true;
  try {
    const res = await apiFetch("/bulk-upload-send", {
      method: "POST",
      body: formData,
    });

    const summary = `Campaign done: sent ${res.sent}, draft ${res.draft || 0}, failed ${res.failed}, skipped ${res.skipped}`;
    showToast(summary, res.failed > 0);

    const lines = (res.results || []).map((row) => {
      const name = row.company_name ? ` (${row.company_name})` : "";
      return `Row ${row.row}${name}: ${row.status} - ${row.message}`;
    });
    el.preview.classList.remove("muted");
    el.preview.textContent = [summary, "", ...lines].join("\n");

    await refreshData();
    await refreshAnalytics();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    if (el.bulkUploadBtn) el.bulkUploadBtn.disabled = false;
  }
}

async function handlePreviewImport() {
  if (!ensureCampaignInputProvided()) {
    showToast("Please select a file or provide Google Sheet URL.", true);
    return;
  }

  const formData = new FormData();
  const file = el.bulkCsvFile?.files?.[0];
  const sheet = el.googleSheetUrl?.value.trim() || "";
  if (file) formData.append("file", file);
  if (sheet) formData.append("google_sheet_url", sheet);
  const mapping = el.mappingJson?.value.trim() || "";
  if (mapping) formData.append("mapping_json", mapping);
  formData.append("max_rows", "30");

  if (el.previewImportBtn) el.previewImportBtn.disabled = true;
  try {
    state.importPreview = await apiFetch("/import/preview", {
      method: "POST",
      body: formData,
    });
    renderImportPreview();
    const errors = state.importPreview.row_errors?.length || 0;
    showToast(`Preview ready. Rows: ${state.importPreview.total_rows}, issues: ${errors}`, errors > 0);
  } catch (err) {
    showToast(err.message, true);
  } finally {
    if (el.previewImportBtn) el.previewImportBtn.disabled = false;
  }
}

async function handleTemplateSave(evt) {
  evt.preventDefault();
  const name = el.templateName?.value.trim() || "";
  const guidance = el.templateGuidance?.value.trim() || "";
  if (!name || !guidance) {
    showToast("Template name and guidance are required.", true);
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("guidance", guidance);
  try {
    await apiFetch("/templates", {
      method: "POST",
      body: formData,
    });
    showToast("Template saved.");
    if (el.templateForm) el.templateForm.reset();
    await refreshTemplates();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleRunFollowups() {
  if (el.runFollowupsBtn) el.runFollowupsBtn.disabled = true;
  try {
    const res = await apiFetch("/followups/run-due", { method: "POST" });
    showToast(`Follow-ups: sent ${res.sent}, failed ${res.failed}, skipped ${res.skipped}`, res.failed > 0);
    await refreshAnalytics();
    await refreshData();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    if (el.runFollowupsBtn) el.runFollowupsBtn.disabled = false;
  }
}

async function handleReplySync(evt) {
  evt.preventDefault();
  const companyId = el.replyCompanyId?.value.trim() || "";
  if (!companyId) {
    showToast("Company ID is required.", true);
    return;
  }

  const payload = [
    {
      company_id: companyId,
      status: el.replyStatus?.value || "replied",
      message: el.replyMessage?.value.trim() || "",
    },
  ];

  try {
    const res = await apiFetch("/replies/sync", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    showToast(`Reply synced. Accepted: ${res.accepted}`);
    if (el.replySyncForm) el.replySyncForm.reset();
    await refreshAnalytics();
    await refreshData();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleActionClick(evt) {
  const target = evt.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const action = target.dataset.action;
  const companyId = target.dataset.id;
  if (!action || !companyId) return;

  const emailInput = document.querySelector(`[data-email-input="${companyId}"]`);
  const hrEmail = emailInput instanceof HTMLInputElement ? emailInput.value.trim() : "";

  target.disabled = true;
  try {
    if (action === "save-email") {
      await apiFetch(`/companies/${companyId}/hr-email`, {
        method: "PATCH",
        body: JSON.stringify({ hr_email: hrEmail }),
      });
      showToast("HR email saved.");
    }
    if (action === "generate") {
      const res = await apiFetch(`/generate-email/${companyId}`, {
        method: "POST",
        body: JSON.stringify({ hr_email: hrEmail || null }),
      });
      el.preview.classList.remove("muted");
      el.preview.textContent = `Subject: ${res.subject}\n\n${res.body}`;
      showToast("Email generated and saved as pending.");
    }
    if (action === "send") {
      const res = await apiFetch(`/send-email/${companyId}`, {
        method: "POST",
        body: JSON.stringify({ hr_email: hrEmail || null }),
      });
      showToast(`Send status: ${res.status}`);
    }
    await refreshData();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    target.disabled = false;
  }
}

function switchTab(tabName) {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.dataset.page === tabName);
  });
  // Scroll main-content to top when switching pages
  const main = document.querySelector(".main-content");
  if (main) main.scrollTop = 0;
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  el.inputType.addEventListener("change", () => setMode(el.inputType.value));
  el.addJobForm.addEventListener("submit", handleAddJob);
  el.bulkUploadForm.addEventListener("submit", handleBulkUpload);
  el.previewImportBtn.addEventListener("click", handlePreviewImport);
  el.templateForm.addEventListener("submit", handleTemplateSave);
  el.runFollowupsBtn.addEventListener("click", handleRunFollowups);
  el.replySyncForm.addEventListener("submit", handleReplySync);
  el.companiesBody.addEventListener("click", handleActionClick);
  el.refreshBtn.addEventListener("click", refreshData);
}

(async function init() {
  bindEvents();
  setMode("url");
  try {
    await refreshData();
    await refreshTemplates();
    await refreshAnalytics();
    renderImportPreview();
  } catch (err) {
    showToast(err.message, true);
  }
})();
