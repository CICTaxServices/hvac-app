const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendTechnicianAssignmentEmail = async (technician, ticket) => {
  try {
    await sgMail.send({
      to: technician.email,
      from: process.env.EMAIL_FROM,
      subject: `New Service Ticket Assigned: ${ticket.ticket_number}`,
      html: `
        <h2>New Service Assignment</h2>
        <p>Hello ${technician.name},</p>
        <p>You have been assigned a new service ticket:</p>
        <ul>
          <li><strong>Ticket #:</strong> ${ticket.ticket_number}</li>
          <li><strong>Customer:</strong> ${ticket.customer_name}</li>
          <li><strong>Address:</strong> ${ticket.property_address}</li>
          <li><strong>Service Type:</strong> ${ticket.service_type}</li>
          <li><strong>Description:</strong> ${ticket.description}</li>
        </ul>
        <p>Please log in to the HVAC Service app to view full details and update the ticket status.</p>
      `,
    });
    console.log('Technician assignment email sent to', technician.email);
  } catch (error) {
    console.error('Error sending technician assignment email:', error);
  }
};

const sendOwnerVerificationEmail = async (owner, ticket, workLog) => {
  try {
    await sgMail.send({
      to: owner.email,
      from: process.env.EMAIL_FROM,
      subject: `Work Completed - Verification Required: ${ticket.ticket_number}`,
      html: `
        <h2>Service Work Completed - Awaiting Verification</h2>
        <p>Hello ${owner.name},</p>
        <p>The technician has completed the work for ticket ${ticket.ticket_number}.</p>
        <ul>
          <li><strong>Customer:</strong> ${ticket.customer_name}</li>
          <li><strong>Address:</strong> ${ticket.property_address}</li>
          <li><strong>Equipment Serial:</strong> ${workLog.serial_number}</li>
          <li><strong>Work Description:</strong> ${workLog.work_description}</li>
          <li><strong>Hours Worked:</strong> ${workLog.hours_worked}</li>
        </ul>
        <p>Please log in to the HVAC Service app to verify the work and assign a price.</p>
      `,
    });
    console.log('Owner verification email sent to', owner.email);
  } catch (error) {
    console.error('Error sending owner verification email:', error);
  }
};

const sendBillingEmail = async (accountingEmail, ticket, billing) => {
  try {
    await sgMail.send({
      to: accountingEmail,
      from: process.env.EMAIL_FROM,
      subject: `Ticket Ready for Billing: ${ticket.ticket_number}`,
      html: `
        <h2>Ticket Ready for Billing</h2>
        <p>A completed and verified service ticket is ready for billing.</p>
        <ul>
          <li><strong>Ticket #:</strong> ${ticket.ticket_number}</li>
          <li><strong>Customer:</strong> ${ticket.customer_name}</li>
          <li><strong>Amount:</strong> $${billing.amount.toFixed(2)}</li>
        </ul>
        <p>Please log in to the accounting section to process the billing.</p>
      `,
    });
    console.log('Billing email sent to', accountingEmail);
  } catch (error) {
    console.error('Error sending billing email:', error);
  }
};

module.exports = {
  sendTechnicianAssignmentEmail,
  sendOwnerVerificationEmail,
  sendBillingEmail,
};
