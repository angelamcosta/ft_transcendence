import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
	host: "smtp-relay.brevo.com",
    port: 587,
	secure: false,
	auth: {
		user: process.env.eService_email,
		pass: process.env.eService_password
	},
});

export async function sendEmail(to, otp) {
	const mailOptions = {
		from: '"ft_transcendence" <transcendenceft12@hotmail.com>',
		to: `${to}`,
		subject: 'Transcendence verification code',
		text: `Your verification code is: ${otp}`
	};

	await transporter.sendMail(mailOptions)
}