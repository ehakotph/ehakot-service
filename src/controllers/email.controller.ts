import { type Request, type Response } from 'express';
import { sendTemplateEmail } from '@/utilities/nodemailer';

export const sendTestEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { to, subject, name, message } = req.body;

        if (!to || !subject) {
            res.status(400).json({ error: 'Missing required fields: to, subject' });
            return;
        }

        await sendTemplateEmail({
            to,
            subject,
            templateName: 'sample', // Uses src/templates/emails/sample.hbs
            context: {
                title: subject,
                name: name || 'Valued User',
                message: message || 'This is a test email sent from our Express application.'
            }
        });

        res.status(200).json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error in sendTestEmail controller:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
};
