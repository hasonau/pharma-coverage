export function generateApplicationEmail({
    pharmacyName,
    pharmacistName,
    licenseNumber,
    shiftDate,
    notes,
    dashboardURL
}) {
    const formattedDate = new Date(shiftDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    return `
  <!-- Email body: "New Pharmacist Application Received" -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-family: Arial, Helvetica, sans-serif; background:#f6f7f9; padding:20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:6px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding:20px 24px; background:#0b76d1; color:#ffffff; text-align:left;">
              <h1 style="margin:0; font-size:18px; line-height:22px;">New Pharmacist Application Received</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:20px 24px; color:#333333; font-size:14px; line-height:20px;">
              <p style="margin:0 0 12px 0;">Dear <strong>${pharmacyName}</strong>,</p>

              <p style="margin:0 0 12px 0;">
                A pharmacist named <strong>${pharmacistName}</strong> (License <strong>${licenseNumber}</strong>)
                has applied for your shift scheduled on <strong>${formattedDate}</strong>.
              </p>

              <p style="margin:0 0 12px 0;">
                Notes from pharmacist: <em>${notes || "No additional notes provided."}</em>
              </p>

              <p style="margin:0 0 16px 0;">
                You can view this application in your
                <a href="${dashboardURL}" style="color:#0b76d1; text-decoration:none;">Pharmacy Dashboard</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px; background:#f1f4f8; color:#666666; font-size:12px; text-align:left;">
              — Pharma Coverage System
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;
}
