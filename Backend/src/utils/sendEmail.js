import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
})

export const sendWelcomeEmail = async ({ fullName, email, username, password, role, department, employeeId }) => {
    const mailOptions = {
        from: `"Company System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Account Has Been Created",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                
                <h2 style="color: #333;">Welcome, ${fullName}! 👋</h2>
                <p style="color: #555;">Your account has been created. Here are your login details:</p>

                <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Account Details</h3>
                    <p><strong>Full Name:</strong> ${fullName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Username:</strong> ${username}</p>
                    <p><strong>Password:</strong> ${password}</p>
                    <p><strong>Role:</strong> ${role}</p>
                    ${department ? `<p><strong>Department:</strong> ${department}</p>` : ""}
                    ${employeeId ? `<p><strong>Employee ID:</strong> ${employeeId}</p>` : ""}
                </div>

                <div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin: 20px 0;">
                    <p style="color: #856404; margin: 0;">
                        ⚠️ Please change your password after first login for security.
                    </p>
                </div>

                <p style="color: #555;">
                    Login here: 
                    <a href="http://localhost:8000" style="color: #007bff;">Company Portal</a>
                </p>

                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    This is an automated email. Please do not reply.
                </p>

            </div>
        `
    }

    await transporter.sendMail(mailOptions)
}