/**
 * notifications.js
 */

const NOTIFICATION_ICONS = {
  comment: "💬",
  team_invite: "👥",
  rating: "⭐",
  certification: "✅",
  solution_selected: "🏆",
  implementation_update: "📊",
  default: "🔔"
};

function renderNotifications(notifications) {
  const container = document.getElementById("notifications-list");
  if (notifications.length === 0) {
    renderEmpty(container, "No notifications yet.");
    return;
  }

  container.innerHTML = `
    <div class="mini-list">
      ${notifications
        .map((n) => {
          const icon = NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.default;
          const unread = !n.read;
          return `
          <div class="mini-row" data-id="${n.id || n._id}" style="${unread ? "border-left: 3px solid var(--color-navy-700);" : ""}">
            <div style="display:flex; gap:12px; align-items:flex-start;">
              <span aria-hidden="true">${icon}</span>
              <div>
                <div class="mini-title">${escapeHtml(n.message)}</div>
                <div class="mini-meta">${formatDate(n.createdAt)}</div>
              </div>
            </div>
            ${n.link ? `<a href="${n.link}" class="btn btn--outline btn--small">View</a>` : ""}
          </div>
        `;
        })
        .join("")}
    </div>
  `;

  container.querySelectorAll(".mini-row[data-id]").forEach((row) => {
    row.addEventListener("click", async () => {
      try {
        await markNotificationRead(row.dataset.id);
      } catch (error) {
        // Non-critical — ignore silently if this fails.
      }
    });
  });
}

async function loadNotifications() {
  const container = document.getElementById("notifications-list");
  renderLoading(container, "Loading notifications...");
  try {
    const data = await getNotifications();
    const notifications = data.notifications || data || [];
    renderNotifications(notifications);
  } catch (error) {
    renderError(container, error.message, loadNotifications);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth()) return;
  loadNotifications();
});