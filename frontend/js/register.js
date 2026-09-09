/**
 * register.js — renders role-specific fields and submits registration.
 *
 * Each role has a genuinely different set of fields (per the product
 * spec), so the form is built dynamically based on the selected role
 * rather than showing/hiding one fixed set of inputs.
 */

const ROLE_FIELD_DEFINITIONS = {
  citizen: [
    { id: "name", label: "Name", type: "text", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "password", label: "Password", type: "password", required: true },
    { id: "confirmPassword", label: "Confirm Password", type: "password", required: true },
    { id: "phone", label: "Phone", type: "tel", required: true },
    { id: "location", label: "Location", type: "text", required: true }
  ],
  student: [
    { id: "name", label: "Name", type: "text", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "password", label: "Password", type: "password", required: true },
    { id: "confirmPassword", label: "Confirm Password", type: "password", required: true },
    { id: "college", label: "College / University", type: "text", required: true },
    { id: "course", label: "Course", type: "text", required: true },
    { id: "branch", label: "Branch", type: "text", required: true },
    { id: "year", label: "Year", type: "text", required: true },
    { id: "skills", label: "Skills", type: "text", required: true, hint: "Separate multiple skills with commas." },
    { id: "interests", label: "Areas of Interest", type: "text", required: false },
    { id: "location", label: "Location", type: "text", required: true },
    { id: "certificates", label: "Skill Certificates / Proofs", type: "file", required: false, multiple: true }
  ],
  researcher: [
    { id: "name", label: "Name", type: "text", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "password", label: "Password", type: "password", required: true },
    { id: "institution", label: "Institution", type: "text", required: true },
    { id: "researchArea", label: "Research Area", type: "text", required: true },
    { id: "specialization", label: "Specialization", type: "text", required: true },
    { id: "experience", label: "Experience", type: "text", required: true, hint: "e.g. 6 years" },
    { id: "skills", label: "Skills", type: "text", required: true },
    { id: "interests", label: "Areas of Interest", type: "text", required: false },
    { id: "profileLinks", label: "Research Papers / Profile Links", type: "text", required: false },
    { id: "certificates", label: "Certifications / Proofs", type: "file", required: false, multiple: true }
  ],
  university: [
    { id: "universityName", label: "University Name", type: "text", required: true },
    { id: "officialEmail", label: "Official Email", type: "email", required: true },
    { id: "location", label: "Location", type: "text", required: true },
    { id: "website", label: "Website", type: "url", required: false },
    { id: "departments", label: "Departments", type: "text", required: true, hint: "Separate multiple departments with commas." },
    { id: "expertise", label: "Areas of Expertise", type: "text", required: false },
    { id: "contactPerson", label: "Contact Person", type: "text", required: true },
    { id: "verificationDocument", label: "Verification Document", type: "file", required: true, multiple: false }
  ],
  industry: [
    { id: "name", label: "Name", type: "text", required: true },
    { id: "email", label: "Email", type: "email", required: true },
    { id: "password", label: "Password", type: "password", required: true },
    { id: "companyName", label: "Company Name", type: "text", required: true },
    { id: "designation", label: "Designation", type: "text", required: true },
    { id: "industrySector", label: "Industry Sector", type: "text", required: true },
    { id: "experience", label: "Experience", type: "text", required: true },
    { id: "skills", label: "Skills", type: "text", required: false },
    { id: "expertise", label: "Areas of Expertise", type: "text", required: false },
    { id: "certificates", label: "Certifications / Proofs", type: "file", required: false, multiple: true }
  ]
};

function fieldHtml(field) {
  const requiredAttr = field.required ? "required" : "";
  const wrapperId = `field-${field.id}`;

  if (field.type === "file") {
    return `
      <div class="field" id="${wrapperId}">
        <label for="${field.id}">${field.label}</label>
        <input type="file" id="${field.id}" name="${field.id}" ${field.multiple ? "multiple" : ""} ${requiredAttr} />
        ${field.hint ? `<div class="hint">${field.hint}</div>` : ""}
        <div class="field-error">This field is required.</div>
      </div>
    `;
  }

  return `
    <div class="field" id="${wrapperId}">
      <label for="${field.id}">${field.label}</label>
      <input type="${field.type}" id="${field.id}" name="${field.id}" ${requiredAttr} />
      ${field.hint ? `<div class="hint">${field.hint}</div>` : ""}
      <div class="field-error">This field is required.</div>
    </div>
  `;
}

function renderRoleFields(role) {
  const container = document.getElementById("fields-role");
  const fields = ROLE_FIELD_DEFINITIONS[role] || [];
  container.innerHTML = fields.map(fieldHtml).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  if (isLoggedIn()) {
    window.location.href = "dashboard.html";
    return;
  }

  const roleInputs = document.querySelectorAll('input[name="role"]');
  const form = document.getElementById("register-form");
  const errorBox = document.getElementById("register-error");
  const successBox = document.getElementById("register-success");
  const submitBtn = document.getElementById("register-submit");

  function currentRole() {
    return document.querySelector('input[name="role"]:checked').value;
  }

  renderRoleFields(currentRole());

  roleInputs.forEach((input) => {
    input.addEventListener("change", () => renderRoleFields(input.value));
  });

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add("auth-alert--visible");
    successBox.classList.remove("auth-alert--visible");
  }

  function showSuccess(message) {
    successBox.textContent = message;
    successBox.classList.add("auth-alert--visible");
    errorBox.classList.remove("auth-alert--visible");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.classList.remove("auth-alert--visible");
    successBox.classList.remove("auth-alert--visible");

    const role = currentRole();
    const fields = ROLE_FIELD_DEFINITIONS[role];

    // Basic required-field validation.
    let valid = true;
    fields.forEach((field) => {
      const el = document.getElementById(field.id);
      const wrapper = document.getElementById(`field-${field.id}`);
      const isEmpty = field.type === "file" ? el.files.length === 0 : !el.value.trim();
      const shouldFlag = field.required && isEmpty;
      wrapper.classList.toggle("field--invalid", shouldFlag);
      if (shouldFlag) valid = false;
    });

    const passwordField = fields.find((f) => f.id === "password");
    const confirmField = fields.find((f) => f.id === "confirmPassword");
    if (passwordField && confirmField) {
      const pw = document.getElementById("password").value;
      const cpw = document.getElementById("confirmPassword").value;
      const mismatch = pw !== cpw;
      document.getElementById("field-confirmPassword").classList.toggle("field--invalid", mismatch);
      if (mismatch) {
        document.querySelector("#field-confirmPassword .field-error").textContent = "Passwords do not match.";
        valid = false;
      }
    }

    if (!valid) {
      showError("Please fill in all required fields correctly.");
      return;
    }

    const hasFileField = fields.some((f) => f.type === "file");
    let payload;

    if (hasFileField) {
      payload = new FormData();
      payload.append("role", role);
      fields.forEach((field) => {
        const el = document.getElementById(field.id);
        if (field.type === "file") {
          Array.from(el.files).forEach((file) => payload.append(field.id, file));
        } else {
          payload.append(field.id, el.value.trim());
        }
      });
    } else {
      payload = { role };
      fields.forEach((field) => {
        payload[field.id] = document.getElementById(field.id).value.trim();
      });
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account...";

    try {
      const response = await registerUser(payload, hasFileField);
      showSuccess("Account created successfully. You can now log in.");
      form.reset();
      renderRoleFields(currentRole());

      if (response && response.token) {
        setToken(response.token);
        if (response.user) cacheUser(response.user);
        setTimeout(() => { window.location.href = "dashboard.html"; }, 900);
      } else {
        setTimeout(() => { window.location.href = "login.html"; }, 1200);
      }
    } catch (error) {
      showError(error.message || "Unable to create your account. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Create account";
    }
  });
});