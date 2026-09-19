/**
 * @fileoverview Controlador para el envío de correos electrónicos.
 */
const nodemailer = require('nodemailer');

exports.enviarReportePDF = async (req, res) => {
    try {
        const { emailDestino, asunto, pdfBase64, filename } = req.body;

        if (!emailDestino || !pdfBase64) {
            return res.status(400).json({ error: 'Faltan datos obligatorios: emailDestino o pdfBase64' });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({ error: 'Las credenciales de correo no están configuradas en el servidor.' });
        }

        // Configurar el transportador usando las credenciales del .env
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // La data URI normalmente viene con el prefijo "data:application/pdf;filename=generated.pdf;base64,"
        // Necesitamos extraer solo el string en base64 puro.
        let pureBase64 = pdfBase64;
        if (pdfBase64.includes('base64,')) {
            pureBase64 = pdfBase64.split('base64,')[1];
        }

        // Configurar el mensaje
        const mailOptions = {
            from: `"Sistema SDM" <${process.env.EMAIL_USER}>`,
            to: emailDestino,
            subject: asunto || 'Reporte del Sistema SDM',
            text: 'Hola,\n\nAdjunto se encuentra el reporte PDF generado por el Sistema SDM.\n\nSaludos.',
            attachments: [
                {
                    filename: filename || 'reporte.pdf',
                    content: pureBase64,
                    encoding: 'base64'
                }
            ]
        };

        // Enviar el correo
        const info = await transporter.sendMail(mailOptions);
        
        res.json({ message: 'Correo enviado con éxito', messageId: info.messageId });

    } catch (error) {
        console.error('Error enviando correo:', error);
        res.status(500).json({ error: 'Error interno al enviar el correo' });
    }
};
