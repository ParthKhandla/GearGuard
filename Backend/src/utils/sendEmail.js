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

export const sendOtpEmail = async ({ email, otp, fullName }) => {
    const mailOptions = {
        from: `"Company System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Password Reset OTP",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                
                <h2 style="color: #333;">Password Reset Request</h2>
                <p style="color: #555;">Hi ${fullName},</p>
                <p style="color: #555;">We received a request to reset your password. Use the OTP below to proceed:</p>

                <div style="background: #f0f0f0; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
                    <h1 style="color: #667eea; margin: 0; letter-spacing: 2px;">${otp}</h1>
                </div>

                <div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin: 20px 0;">
                    <p style="color: #856404; margin: 0;">
                        ⏰ This OTP is valid for 10 minutes only.
                    </p>
                </div>

                <p style="color: #555;">
                    If you didn't request a password reset, please ignore this email.
                </p>

                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    This is an automated email. Please do not reply.
                </p>

            </div>
        `
    }

    await transporter.sendMail(mailOptions)
}

export const sendTaskAssignmentEmail = async ({ technicianEmail, technicianName, taskTitle, taskDescription, machineName, machineId, category, department, severity }) => {
    const severityColor = severity === 'critical' ? '#d32f2f' : severity === 'moderate' ? '#ff9800' : '#2196f3'
    
    const mailOptions = {
        from: `"GearGuard System" <${process.env.EMAIL_USER}>`,
        to: technicianEmail,
        subject: `New Task Assigned: ${taskTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                
                <h2 style="color: #333;">📋 New Task Assigned</h2>
                <p style="color: #555;">Hi ${technicianName},</p>
                <p style="color: #555;">A new maintenance task has been assigned to you. Please review the details below:</p>

                <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Task Details</h3>
                    <p><strong>Task Title:</strong> ${taskTitle}</p>
                    <p><strong>Description:</strong> ${taskDescription}</p>
                    <p>
                        <strong>Severity:</strong> 
                        <span style="display: inline-block; background: ${severityColor}; color: white; padding: 4px 10px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 12px;">
                            ${severity}
                        </span>
                    </p>
                </div>

                <div style="background: #f0f7ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2196f3;">
                    <h3 style="color: #1976d2; margin-top: 0;">🔧 Machine Information</h3>
                    <p><strong>Machine Name:</strong> ${machineName}</p>
                    <p><strong>Machine ID:</strong> ${machineId}</p>
                    <p><strong>Category:</strong> ${category}</p>
                    <p><strong>Department:</strong> ${department}</p>
                </div>

                <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; margin: 20px 0;">
                    <p style="color: #1976d2; margin: 0;">
                        ✅ Please log in to the GearGuard portal to view and update the task status.
                    </p>
                </div>

                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    This is an automated email. Please do not reply.
                </p>

            </div>
        `
    }

    await transporter.sendMail(mailOptions)
}