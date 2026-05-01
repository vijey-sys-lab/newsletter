/**
 * The Ink — Firebase Cloud Functions
 * Triggers:
 *   1. onNewSubscriber  → welcome email when a subscriber doc is created
 *   2. onNewArticle     → broadcast email to all subscribers when an article is published
 *
 * Email provider: Resend (resend.com) — free up to 3,000 emails/month
 * Secret: RESEND_API_KEY  (set via: firebase functions:secrets:set RESEND_API_KEY)
 * Sender: configure FROM_EMAIL below to match your verified domain
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { Resend } = require("resend");

initializeApp();

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Change FROM_EMAIL to your verified sender domain in Resend (e.g. ink@devverse1.in)
const FROM_EMAIL = "The Ink <ink@devverse1.in>";
const SITE_URL   = "https://theink.devverse1.in"; // Change to your actual site URL
// ──────────────────────────────────────────────────────────────────────────────

// ── Helper: send via Resend ───────────────────────────────────────────────────
async function sendEmail(apiKey, { to, subject, html }) {
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
  if (error) throw new Error(JSON.stringify(error));
  return data;
}

// ── Helper: get all subscriber emails ────────────────────────────────────────
async function getAllSubscriberEmails() {
  const db = getFirestore();
  const snap = await db.collection("subscribers").get();
  return snap.docs.map((d) => d.data().email).filter(Boolean);
}

// ── Email Templates ───────────────────────────────────────────────────────────

function welcomeTemplate(email) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to The Ink</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1A1510;padding:40px 48px;text-align:center;position:relative;">
              <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.25em;text-transform:uppercase;color:#C9973A;margin-bottom:12px;">Est. 2026</div>
              <div style="font-family:Georgia,serif;font-size:42px;font-weight:700;color:#F5F0E8;letter-spacing:0.02em;">The <span style="color:#C9973A;">Ink</span></div>
              <div style="width:40px;height:2px;background:#C9973A;margin:16px auto 0;"></div>
              <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#7A6E5F;margin-top:12px;">Thoughts · Insights · Stories</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#FFFFFF;padding:48px 48px 40px;border-left:1px solid #E8E0D0;border-right:1px solid #E8E0D0;">
              <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#1A1510;line-height:1.3;margin-bottom:24px;">
                Welcome aboard, reader.
              </div>
              <div style="width:36px;height:2px;background:#C9973A;margin-bottom:28px;"></div>
              <p style="font-family:Georgia,serif;font-size:16px;color:#3D3328;line-height:1.8;margin:0 0 20px;">
                You're now a subscriber of <strong>The Ink</strong> — a space for ideas on technology, entrepreneurship, and the stories that shape us.
              </p>
              <p style="font-family:Georgia,serif;font-size:16px;color:#3D3328;line-height:1.8;margin:0 0 20px;">
                Every time I publish a new article, it lands directly in your inbox. No noise. No algorithm. Just words, carefully written.
              </p>
              <p style="font-family:Georgia,serif;font-size:16px;color:#3D3328;line-height:1.8;margin:0 0 32px;">
                — Vijey Prasanna
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#1A1510;padding:14px 36px;">
                    <a href="${SITE_URL}" style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#F5F0E8;text-decoration:none;">Read The Latest →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider rule -->
          <tr>
            <td style="background:#FFFFFF;padding:0 48px;border-left:1px solid #E8E0D0;border-right:1px solid #E8E0D0;">
              <div style="border-top:3px double #E8E0D0;margin:0;"></div>
            </td>
          </tr>

          <!-- Quote -->
          <tr>
            <td style="background:#FFFFFF;padding:28px 48px 40px;border-left:1px solid #E8E0D0;border-right:1px solid #E8E0D0;">
              <p style="font-family:Georgia,serif;font-size:15px;font-style:italic;color:#9A8E7E;text-align:center;line-height:1.7;margin:0;">
                "The pen is mightier than the sword — and considerably easier to carry."
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1A1510;padding:28px 48px;text-align:center;">
              <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#7A6E5F;margin-bottom:8px;">The Ink · Vijey Prasanna</div>
              <div style="font-family:Arial,sans-serif;font-size:11px;color:#5A5043;">
                <a href="${SITE_URL}" style="color:#C9973A;text-decoration:none;">Visit Site</a>
                &nbsp;·&nbsp;
                Built by <a href="https://devverse1.in" style="color:#C9973A;text-decoration:none;">Devverse</a>
              </div>
              <div style="font-family:Arial,sans-serif;font-size:10px;color:#3D3328;margin-top:12px;">
                You're receiving this because ${email} subscribed at The Ink.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function articleTemplate(article) {
  const articleURL = `${SITE_URL}/article.html?id=${article.id}`;
  const tag = article.tag || "Essay";
  const excerpt = article.excerpt || "";

  // Render first ~300 chars of body as preview
  const bodyPreview = (article.body || "")
    .replace(/^## .+$/gm, "")
    .replace(/^> /gm, "")
    .trim()
    .slice(0, 300);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${article.title} — The Ink</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Masthead -->
          <tr>
            <td style="background:#1A1510;padding:28px 48px;text-align:center;">
              <a href="${SITE_URL}" style="font-family:Georgia,serif;font-size:32px;font-weight:700;color:#F5F0E8;text-decoration:none;letter-spacing:0.02em;">The <span style="color:#C9973A;">Ink</span></a>
              <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#7A6E5F;margin-top:8px;">New Article</div>
            </td>
          </tr>

          <!-- Article Cover -->
          <tr>
            <td style="background:#2E2318;padding:52px 48px;text-align:center;position:relative;">
              <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#C9973A;margin-bottom:16px;">${tag}</div>
              <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#F5F0E8;line-height:1.25;max-width:480px;margin:0 auto;">${article.title}</div>
              <div style="width:40px;height:2px;background:#C9973A;margin:20px auto;"></div>
              <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#7A6E5F;">Vijey Prasanna · The Ink</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#FFFFFF;padding:48px 48px 40px;border-left:1px solid #E8E0D0;border-right:1px solid #E8E0D0;">
              ${excerpt ? `<p style="font-family:Georgia,serif;font-size:18px;font-style:italic;color:#3D3328;line-height:1.7;margin:0 0 24px;padding-bottom:24px;border-bottom:1px solid #E8E0D0;">${excerpt}</p>` : ""}
              <p style="font-family:Georgia,serif;font-size:15px;color:#5A5043;line-height:1.85;margin:0 0 28px;">${bodyPreview}${bodyPreview.length >= 300 ? "…" : ""}</p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#C9973A;padding:14px 36px;">
                    <a href="${articleURL}" style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#1A1510;text-decoration:none;font-weight:700;">Continue Reading →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Rule -->
          <tr>
            <td style="background:#FFFFFF;padding:0 48px;border-left:1px solid #E8E0D0;border-right:1px solid #E8E0D0;">
              <div style="border-top:3px double #E8E0D0;margin:0;"></div>
            </td>
          </tr>

          <!-- About -->
          <tr>
            <td style="background:#FFFFFF;padding:28px 48px 40px;border-left:1px solid #E8E0D0;border-right:1px solid #E8E0D0;">
              <p style="font-family:Georgia,serif;font-size:13px;color:#9A8E7E;text-align:center;line-height:1.7;margin:0;">
                I'm Vijey Prasanna — founder of Devverse, writing about technology, entrepreneurship, and the stories that shape us.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1A1510;padding:28px 48px;text-align:center;">
              <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#7A6E5F;margin-bottom:8px;">The Ink · Vijey Prasanna</div>
              <div style="font-family:Arial,sans-serif;font-size:11px;color:#5A5043;">
                <a href="${SITE_URL}" style="color:#C9973A;text-decoration:none;">All Articles</a>
                &nbsp;·&nbsp;
                Built by <a href="https://devverse1.in" style="color:#C9973A;text-decoration:none;">Devverse</a>
              </div>
              <div style="font-family:Arial,sans-serif;font-size:10px;color:#3D3328;margin-top:12px;">
                You're receiving this because you subscribed to The Ink.<br/>
                <a href="${SITE_URL}" style="color:#5A5043;">Manage preferences</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── TRIGGER 1: Welcome email on new subscriber ────────────────────────────────
exports.onNewSubscriber = onDocumentCreated(
  {
    document: "subscribers/{subscriberId}",
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const data = event.data.data();
    const email = data?.email;
    if (!email) {
      console.warn("onNewSubscriber: no email in document, skipping.");
      return;
    }

    console.log(`Sending welcome email to: ${email}`);
    try {
      await sendEmail(RESEND_API_KEY.value(), {
        to: email,
        subject: "Welcome to The Ink ✦",
        html: welcomeTemplate(email),
      });
      console.log(`Welcome email sent to ${email}`);
    } catch (err) {
      console.error(`Failed to send welcome email to ${email}:`, err);
    }
  }
);

// ── TRIGGER 2: Broadcast email on new article ─────────────────────────────────
exports.onNewArticle = onDocumentCreated(
  {
    document: "articles/{articleId}",
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const data = event.data.data();
    const articleId = event.params.articleId;

    if (!data?.title || !data?.body) {
      console.warn("onNewArticle: missing title or body, skipping.");
      return;
    }

    const article = { id: articleId, ...data };

    let emails;
    try {
      emails = await getAllSubscriberEmails();
    } catch (err) {
      console.error("Failed to fetch subscribers:", err);
      return;
    }

    if (!emails.length) {
      console.log("No subscribers yet — nothing to broadcast.");
      return;
    }

    console.log(`Broadcasting "${article.title}" to ${emails.length} subscriber(s)…`);

    // Send in batches of 50 to be kind to Resend rate limits
    const BATCH = 50;
    for (let i = 0; i < emails.length; i += BATCH) {
      const batch = emails.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.map((email) =>
          sendEmail(RESEND_API_KEY.value(), {
            to: email,
            subject: `New on The Ink: ${article.title}`,
            html: articleTemplate(article),
          }).catch((err) => console.error(`Failed sending to ${email}:`, err))
        )
      );
    }

    console.log(`Broadcast complete for article: ${articleId}`);
  }
);
