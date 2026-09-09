/**
 * post-problem.js — handles the problem submission form, including
 * evidence uploads via FormData, and surfaces AI classification /
 * duplicate detection results returned by the backend after submit.
 */

let selectedFiles = [];

function renderFileList() {
  const list = document.getElementById("file-list");
  if (selectedFiles.length === 0) {
    list.innerHTML = "";
    return;
  }
  list.innerHTML = selectedFiles
    .map(
      (file, index) => `
    <div class="file-list-item">
      <span>${escapeHtml(file.name)}</span>
      <button type="button" data-index="${index}">Remove</button>
    </div>
  `
    )
    .join("");

  list.querySelectorAll("button[data-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedFiles.splice(Number(btn.dataset.index), 1);
      renderFileList();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth()) return;

  const fileDrop = document.getElementById("file-drop");
  const fileInput = document.getElementById("evidence-input");

  fileDrop.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    selectedFiles = selectedFiles.concat(Array.from(fileInput.files));
    fileInput.value = "";
    renderFileList();
  });

  fileDrop.addEventListener("dragover", (e) => e.preventDefault());
  fileDrop.addEventListener("drop", (e) => {
    e.preventDefault();
    selectedFiles = selectedFiles.concat(Array.from(e.dataTransfer.files));
    renderFileList();
  });

  const form = document.getElementById("post-problem-form");
  const errorBox = document.getElementById("post-error");
  const submitBtn = document.getElementById("post-submit");

  const requiredFields = [
    "title", "description", "affected", "location", "importance", "expected-impact"
  ];

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.classList.remove("auth-alert--visible");

    let valid = true;
    requiredFields.forEach((id) => {
      const el = document.getElementById(id);
      const wrapper = document.getElementById(`field-${id}`);
      const empty = !el.value.trim();
      wrapper.classList.toggle("field--invalid", empty);
      if (empty) valid = false;
    });

    if (!valid) {
      errorBox.textContent = "Please fill in all required fields.";
      errorBox.classList.add("auth-alert--visible");
      return;
    }

    const formData = new FormData();
    formData.append("title", document.getElementById("title").value.trim());
    formData.append("description", document.getElementById("description").value.trim());
    formData.append("affectedPopulation", document.getElementById("affected").value.trim());
    formData.append("location", document.getElementById("location").value.trim());
    formData.append("importance", document.getElementById("importance").value.trim());
    formData.append("consequence", document.getElementById("consequence").value.trim());
    formData.append("existingAttempts", document.getElementById("existing-attempts").value.trim());
    formData.append("expectedImpact", document.getElementById("expected-impact").value.trim());
    selectedFiles.forEach((file) => formData.append("evidence", file));

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      const response = await createProblem(formData);
      const problem = response.problem || response;
      const id = problem.id || problem._id;
      window.location.href = id ? `problem-details.html?id=${id}` : "problems.html";
    } catch (error) {
      errorBox.textContent = error.message || "Unable to submit the problem right now. Please try again.";
      errorBox.classList.add("auth-alert--visible");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Problem";
    }
  });
});