const nodemailer = require('nodemailer');

function createTransporter() {
  const user = process.env.GMAIL_USER || '';
  const pass = process.env.GMAIL_PASS || '';

  if (!user || !pass || pass === 'your-gmail-app-password') {
    return null; // Signals simulation mode (logs to console safely)
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass
    }
  });
}

/**
 * Format currency in INR / USD style
 */
function formatPrice(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

/**
 * Send automated email notification to website owner
 */
async function sendOwnerNotification(order) {
  const ownerEmail = process.env.OWNER_EMAIL || process.env.GMAIL_USER || 'admin@pinboard.com';
  const transporter = createTransporter();

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eeeeee; font-size: 14px; color: #15141F;">
        <strong>${item.title || 'Poster'}</strong>
        ${item.size ? `<br><span style="font-size: 12px; color: #666;">Size: ${item.size}</span>` : ''}
        <br><span style="font-size: 11px; color: #888;">ID: ${item.productId || 'N/A'}</span>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eeeeee; font-size: 14px; text-align: center; color: #15141F;">
        ${item.quantity || 1}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eeeeee; font-size: 14px; text-align: right; color: #15141F; font-weight: 600;">
        ${formatPrice(item.price)}
      </td>
    </tr>
  `).join('');

  const shippingAddr = order.shippingAddress || {};
  const fullAddress = [
    shippingAddr.street,
    shippingAddr.city,
    shippingAddr.state,
    shippingAddr.pincode
  ].filter(Boolean).join(', ') || 'Address not specified';

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Order Request</title>
  </head>
  <body style="margin:0; padding:0; background-color:#F5F4F0; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F5F4F0; padding: 24px 12px;">
      <tr>
        <td align="center">
          <table width="100%" maxWidth="620" border="0" cellspacing="0" cellpadding="0" style="max-width:620px; background-color:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #E5E3DC; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
            <!-- Header -->
            <tr>
              <td style="background-color:#15141F; padding: 28px 32px; text-align:left;">
                <span style="display:inline-block; width:10px; height:10px; background-color:#E63946; border-radius:50%; margin-right:10px;"></span>
                <span style="color:#FBF9F3; font-size:22px; font-weight:800; letter-spacing:1px; font-family:sans-serif;">PINBOARD STUDIO</span>
                <p style="margin: 6px 0 0 20px; color:#A0A0A0; font-size:12px; text-transform:uppercase; letter-spacing:2px;">New Order Request Received</p>
              </td>
            </tr>

            <!-- Banner -->
            <tr>
              <td style="background-color:#FFF8F0; padding: 14px 32px; border-bottom:1px solid #FFE0C2; color:#C85A00; font-size:13px; font-weight:600;">
                ⚡ Action Required: Contact customer to confirm payment & delivery details.
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 32px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                  <tr>
                    <td>
                      <span style="font-size:12px; color:#888; text-transform:uppercase; letter-spacing:1px;">Order Request ID</span>
                      <h2 style="margin:4px 0 0; font-size:24px; color:#15141F; font-weight:800;">#${order.orderId}</h2>
                    </td>
                    <td align="right" valign="top">
                      <span style="display:inline-block; padding: 6px 12px; background-color:#F5EBE6; color:#E63946; font-size:12px; font-weight:700; border-radius:20px;">
                        Pending Confirmation
                      </span>
                    </td>
                  </tr>
                </table>

                <!-- Customer Details -->
                <div style="background-color:#FBF9F3; border:1px solid #EFECE6; border-radius:8px; padding:18px 20px; margin-bottom:24px;">
                  <h3 style="margin:0 0 12px; font-size:13px; text-transform:uppercase; letter-spacing:1.5px; color:#E63946;">Customer Details</h3>
                  <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size:14px; color:#15141F;">
                    <tr>
                      <td width="120" style="color:#666;"><strong>Name:</strong></td>
                      <td>${order.customerName || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="color:#666;"><strong>Email:</strong></td>
                      <td><a href="mailto:${order.customerEmail}" style="color:#E63946; text-decoration:none; font-weight:600;">${order.customerEmail || 'N/A'}</a></td>
                    </tr>
                    <tr>
                      <td style="color:#666;"><strong>Phone:</strong></td>
                      <td><a href="tel:${order.customerPhone}" style="color:#15141F; text-decoration:none; font-weight:600;">${order.customerPhone || 'N/A'}</a></td>
                    </tr>
                    <tr>
                      <td style="color:#666;" valign="top"><strong>Delivery Address:</strong></td>
                      <td>${fullAddress}</td>
                    </tr>
                    ${order.orderNotes ? `
                    <tr>
                      <td style="color:#666;" valign="top"><strong>Order Notes:</strong></td>
                      <td style="color:#555; font-style:italic;">"${order.orderNotes}"</td>
                    </tr>` : ''}
                  </table>
                </div>

                <!-- Order Items Table -->
                <h3 style="margin:0 0 12px; font-size:13px; text-transform:uppercase; letter-spacing:1.5px; color:#15141F;">Order Summary</h3>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin-bottom:20px;">
                  <thead>
                    <tr style="background-color:#15141F; color:#FFFFFF; font-size:12px; text-transform:uppercase; letter-spacing:1px;">
                      <th align="left" style="padding:10px 12px;">Poster</th>
                      <th align="center" style="padding:10px 12px;">Qty</th>
                      <th align="right" style="padding:10px 12px;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <!-- Totals -->
                <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size:14px; color:#15141F; margin-top:16px;">
                  <tr>
                    <td align="right" style="color:#666;">Subtotal:</td>
                    <td align="right" width="100" style="font-weight:600;">${formatPrice(order.totalAmount)}</td>
                  </tr>
                  <tr>
                    <td align="right" style="color:#666;">Shipping:</td>
                    <td align="right" style="color:#2D6A4F; font-weight:600;">FREE</td>
                  </tr>
                  <tr style="font-size:18px;">
                    <td align="right" style="padding-top:10px; font-weight:800; color:#15141F;">Total Amount:</td>
                    <td align="right" style="padding-top:10px; font-weight:800; color:#E63946;">${formatPrice(order.totalAmount)}</td>
                  </tr>
                </table>

                <!-- Action Button -->
                <div style="margin-top:32px; text-align:center;">
                  <a href="mailto:${order.customerEmail}?subject=Regarding PINBOARD Order Request %23${order.orderId}" style="display:inline-block; background-color:#E63946; color:#FFFFFF; padding:14px 32px; font-size:14px; font-weight:700; text-decoration:none; border-radius:6px; letter-spacing:0.5px;">Reply to Customer &rarr;</a>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#15141F; padding: 20px 32px; text-align:center; color:#888888; font-size:12px;">
                PINBOARD Studio E-Commerce System · Automated Owner Notification
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  if (!transporter) {
    console.log('\n======================================================');
    console.log('📧 [SIMULATED EMAIL TO OWNER]');
    console.log(`To: ${ownerEmail}`);
    console.log(`Reply-To: ${order.customerEmail}`);
    console.log(`Subject: New PINBOARD Order Request — Order #${order.orderId}`);
    console.log(`Customer: ${order.customerName} (${order.customerEmail}, ${order.customerPhone})`);
    console.log(`Total: ${formatPrice(order.totalAmount)}`);
    console.log('======================================================\n');
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"PINBOARD Orders" <${process.env.GMAIL_USER}>`,
      to: ownerEmail,
      replyTo: order.customerEmail,
      subject: `New PINBOARD Order Request — Order #${order.orderId}`,
      html: htmlContent
    });
    console.log(`✔ Owner notification email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Failed to send owner email notification:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send automated thank-you email to customer
 */
async function sendCustomerThankYou(order) {
  const transporter = createTransporter();

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eeeeee; font-size: 14px; color: #15141F;">
        <strong>${item.title || 'Poster'}</strong>
        ${item.size ? `<br><span style="font-size: 12px; color: #666;">Size: ${item.size}</span>` : ''}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eeeeee; font-size: 14px; text-align: center; color: #15141F;">
        ${item.quantity || 1}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eeeeee; font-size: 14px; text-align: right; color: #15141F; font-weight: 600;">
        ${formatPrice(item.price)}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Choosing PINBOARD!</title>
  </head>
  <body style="margin:0; padding:0; background-color:#FBF9F3; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FBF9F3; padding: 24px 12px;">
      <tr>
        <td align="center">
          <table width="100%" maxWidth="620" border="0" cellspacing="0" cellpadding="0" style="max-width:620px; background-color:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #EFECE6; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
            <!-- Header -->
            <tr>
              <td style="background-color:#15141F; padding: 32px; text-align:center;">
                <span style="display:inline-block; width:12px; height:12px; background-color:#E63946; border-radius:50%; margin-right:8px;"></span>
                <span style="color:#FBF9F3; font-size:24px; font-weight:800; letter-spacing:2px; font-family:sans-serif;">PINBOARD</span>
                <p style="margin: 8px 0 0; color:#A0A0A0; font-size:12px; text-transform:uppercase; letter-spacing:2px;">Premium Archival Art Posters</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 36px 32px;">
                <h1 style="margin:0 0 12px; font-size:22px; color:#15141F; font-weight:800;">Thank You for Choosing PINBOARD!</h1>
                <p style="margin:0 0 20px; font-size:15px; color:#444444; line-height:1.6;">
                  Hi <strong>${order.customerName || 'Poster Lover'}</strong>,
                </p>
                <p style="margin:0 0 24px; font-size:15px; color:#444444; line-height:1.6;">
                  We’ve received your order request! We're excited to help bring your space to life with our 300 GSM archival matte prints.
                </p>

                <!-- Order ID Badge -->
                <div style="background-color:#FBF9F3; border:1px dashed #D6D2C4; border-radius:8px; padding:16px 20px; text-align:center; margin-bottom:28px;">
                  <span style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#888;">Your Unique Order Request Reference</span>
                  <div style="font-size:24px; font-weight:800; color:#E63946; margin-top:4px;">#${order.orderId}</div>
                </div>

                <!-- Next Steps Info Box -->
                <div style="background-color:#FFF9F5; border-left:4px solid #E63946; padding:16px 20px; margin-bottom:28px; border-radius:0 8px 8px 0;">
                  <h4 style="margin:0 0 6px; font-size:14px; color:#15141F; text-transform:uppercase; letter-spacing:1px;">What Happens Next?</h4>
                  <p style="margin:0; font-size:13.5px; color:#555; line-height:1.55;">
                    Your request status is currently <strong>Pending Confirmation</strong>. Payment details are not yet collected online. Our team will contact you directly via phone (<strong>${order.customerPhone || 'your phone'}</strong>) or email shortly to confirm your payment method and dispatch timeline.
                  </p>
                </div>

                <!-- Items Summary -->
                <h3 style="margin:0 0 12px; font-size:13px; text-transform:uppercase; letter-spacing:1.5px; color:#15141F;">Requested Posters</h3>
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin-bottom:20px;">
                  <thead>
                    <tr style="background-color:#15141F; color:#FFFFFF; font-size:12px; text-transform:uppercase; letter-spacing:1px;">
                      <th align="left" style="padding:10px 12px;">Item</th>
                      <th align="center" style="padding:10px 12px;">Qty</th>
                      <th align="right" style="padding:10px 12px;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <!-- Total -->
                <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size:14px; color:#15141F;">
                  <tr style="font-size:16px;">
                    <td align="right" style="font-weight:700; color:#15141F;">Total Amount:</td>
                    <td align="right" width="100" style="font-weight:800; color:#E63946;">${formatPrice(order.totalAmount)}</td>
                  </tr>
                </table>

                <p style="margin:32px 0 0; font-size:14px; color:#666; line-height:1.6; text-align:center;">
                  Have questions or need to make changes? Feel free to reply directly to this email or reach us at <a href="mailto:${process.env.OWNER_EMAIL || 'support@pinboard.com'}" style="color:#E63946; font-weight:600;">${process.env.OWNER_EMAIL || 'support@pinboard.com'}</a>.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#15141F; padding: 24px 32px; text-align:center; color:#888888; font-size:12px;">
                <span style="color:#FBF9F3; font-weight:700;">PINBOARD STUDIO</span> · Designed, curated, and printed with archival care.<br>
                © 2026 PINBOARD STUDIO · All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  if (!transporter) {
    console.log('\n======================================================');
    console.log('📧 [SIMULATED EMAIL TO CUSTOMER]');
    console.log(`To: ${order.customerEmail}`);
    console.log(`Subject: Thank You for Choosing PINBOARD! — Order #${order.orderId}`);
    console.log(`Customer: ${order.customerName}`);
    console.log(`Total: ${formatPrice(order.totalAmount)}`);
    console.log('======================================================\n');
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"PINBOARD Studio" <${process.env.GMAIL_USER}>`,
      to: order.customerEmail,
      subject: `Thank You for Choosing PINBOARD! — Order #${order.orderId}`,
      html: htmlContent
    });
    console.log(`✔ Customer thank-you email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Failed to send customer thank-you email:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendOwnerNotification,
  sendCustomerThankYou
};
