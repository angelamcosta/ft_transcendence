import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
	host: "smtp-relay.brevo.com",
    port: 587,
	secure: false,
	auth: {
		user: process.env.eService_user,
		pass: process.env.eService_password
	},
});

export async function sendEmail(to, otp) {
	const mailOptions = {
		from: `"ft_transcendence" <${process.env.eService_email}>`,
		to: `${to}`,
		subject: 'Transcendence verification code',
		text: `Your verification code is: ${otp}`
	}

	try {
		const info = await transporter.sendMail(mailOptions)
		console.log('Email sent:', info.messageId)
		return (true)
	} catch (error) {
		console.error('Email sending failed:', error.message)
		return (false)
	}
}