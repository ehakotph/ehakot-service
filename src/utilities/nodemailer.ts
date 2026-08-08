import nodemailer from 'nodemailer';
import { env } from '@config/env';
import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';

export const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
        user: env.SMTP_USERNAME,
        pass: env.SMTP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: true,
    },
});

export async function testTransporter(): Promise<void> {
    try {
        await transporter.verify();
        console.info(`SMTP Transporter connection verification successful: ${env.SMTP_HOST}`);
    } catch (error: unknown) {
        console.error('SMTP Transporter connection verification failed: ', error);
    }
}

export interface SendTemplateEmailOptions {
    to: string | string[];
    subject: string;
    templateName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: Record<string, any>;
    from?: string;
}

/**
 * Sends an email using a Handlebars template
 */
export async function sendTemplateEmail({
    to,
    subject,
    templateName,
    context,
    from,
}: SendTemplateEmailOptions): Promise<void> {
    try {
        // Resolve path to the Handlebars template
        const templatePath = path.join(process.cwd(), 'src', 'templates', 'emails', `${templateName}.hbs`);
        
        // Read template file
        const templateSource = await fs.readFile(templatePath, 'utf-8');
        
        // Compile template
        const compiledTemplate = handlebars.compile(templateSource);
        const html = compiledTemplate(context);

        const mailOptions = {
            from: from || env.SMTP_USERNAME,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            html,
        };

        await transporter.sendMail(mailOptions);
        console.info(`Template email '${templateName}' sent successfully to ${mailOptions.to}`);
    } catch (error) {
        console.error(`Error sending template email '${templateName}': `, error);
        throw error;
    }
}
