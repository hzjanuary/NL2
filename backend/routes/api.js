const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const db = require('../config/db');
const { authenticateSession } = require('../middleware/auth');

// Route đăng nhập
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password });

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const [users] = await db.promise().query('SELECT * FROM user WHERE Email = ?', [email]);
        console.log('User found:', users);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        if (user.Password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Tạo session mới
        const sessionId = uuidv4();
        const createdAt = new Date();
        const expiresAt = new Date(createdAt.getTime() + 60 * 60 * 1000); // Hết hạn sau 1 giờ

        await db.promise().query(
            'INSERT INTO sessions (SessionID, UserID, CreatedAt, ExpiresAt) VALUES (?, ?, ?, ?)',
            [sessionId, user.UserID, createdAt, expiresAt]
        );

        console.log('Session created:', { sessionId, userId: user.UserID });
        res.json({ message: 'Login successful', sessionId, user: { FullName: user.FullName } });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Route kiểm tra session
router.get('/auth/check-session', async (req, res) => {
    const sessionId = req.headers['x-session-id'];
    console.log('Checking session:', sessionId);

    if (!sessionId) {
        return res.status(401).json({ error: 'Session ID is required' });
    }

    try {
        const [sessions] = await db.promise().query(
            'SELECT s.*, u.FullName FROM sessions s JOIN user u ON s.UserID = u.UserID WHERE s.SessionID = ? AND s.ExpiresAt > NOW()',
            [sessionId]
        );

        if (sessions.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        const session = sessions[0];
        res.json({ message: 'Session valid', user: { FullName: session.FullName } });
    } catch (error) {
        console.error('Error checking session:', error);
        res.status(500).json({ error: 'Failed to check session' });
    }
});

// Route đăng xuất
router.delete('/auth/logout', async (req, res) => {
    const sessionId = req.headers['x-session-id'];
    console.log('Logout attempt:', sessionId);

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
    }

    try {
        const [result] = await db.promise().query('DELETE FROM sessions WHERE SessionID = ?', [sessionId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        console.log('Session deleted:', sessionId);
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

// Lấy danh sách người dùng
router.get('/users', authenticateSession, async (req, res) => {
    try {
        const [users] = await db.promise().query('SELECT UserID, FullName FROM user');
        console.log('Users fetched from DB:', users);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Lấy danh sách khách hàng
router.get("/clients", authenticateSession, async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT ClientID, ClientName FROM client");
        console.log("Clients fetched:", rows);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching clients:", error.message);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

// Thêm khách hàng mới
router.post("/clients", authenticateSession, async (req, res) => {
    const { ClientName } = req.body;
    const ClientID = uuidv4();
    console.log("Received add client request:", { ClientID, ClientName });

    if (!ClientName || typeof ClientName !== "string" || ClientName.trim() === "") {
        return res.status(400).json({ error: 'ClientName is required and must be a non-empty string' });
    }

    try {
        await db.promise().query("INSERT INTO client (ClientID, ClientName) VALUES (?, ?)", [
            ClientID,
            ClientName.trim()
        ]);
        console.log("Client added to database:", { ClientID, ClientName });
        res.status(201).json({ message: "Client added", ClientID });
    } catch (error) {
        console.error("Error adding client to database:", error.message);
        res.status(500).json({ error: 'Failed to add client' });
    }
});

// Cập nhật client
router.put("/clients/:clientId", authenticateSession, async (req, res) => {
    const { clientId } = req.params;
    const { ClientName } = req.body;
    console.log("Received update client request:", { clientId, ClientName });

    if (!ClientName || typeof ClientName !== "string" || ClientName.trim() === "") {
        console.log("Invalid ClientName:", ClientName);
        return res.status(400).json({ error: "ClientName is required and must be a non-empty string" });
    }

    try {
        const [result] = await db.promise().query(
            "UPDATE client SET ClientName = ? WHERE ClientID = ?",
            [ClientName.trim(), clientId]
        );

        if (result.affectedRows === 0) {
            console.log("No client found with ClientID:", clientId);
            return res.status(404).json({ error: "Client not found" });
        }

        console.log("Client updated in database:", { clientId, ClientName });
        res.json({ message: "Client updated successfully" });
    } catch (error) {
        console.error("Error updating client in database:", error.message);
        res.status(500).json({ error: "Failed to update client" });
    }
});

// Xóa client
router.delete("/clients/:clientId", authenticateSession, async (req, res) => {
    const { clientId } = req.params;
    console.log("Received delete client request:", clientId);

    try {
        const [projects] = await db.promise().query(
            "SELECT * FROM project WHERE ClientID = ?",
            [clientId]
        );
        if (projects.length > 0) {
            console.log("Cannot delete client with associated projects:", clientId);
            return res.status(400).json({
                error: "Cannot delete client because it is associated with one or more projects"
            });
        }

        const [result] = await db.promise().query("DELETE FROM client WHERE ClientID = ?", [clientId]);
        if (result.affectedRows === 0) {
            console.log("No client found with ClientID:", clientId);
            return res.status(404).json({ error: "Client not found" });
        }

        console.log("Client deleted from database:", clientId);
        res.json({ message: "Client deleted" });
    } catch (error) {
        console.error("Error deleting client:", error.message);
        res.status(500).json({ error: "Failed to delete client" });
    }
});

// Lấy danh sách dự án
router.get('/projects', authenticateSession, async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            'SELECT p.*, c.ClientName FROM project p LEFT JOIN client c ON p.ClientID = c.ClientID'
        );
        console.log('Projects fetched:', rows);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching projects:', error.message);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Thêm dự án mới
router.post("/projects", authenticateSession, async (req, res) => {
    const { ClientID, ProjectName, Description, StartDate, Deadline } = req.body;
    const ProjectID = uuidv4();
    console.log("Received add project request:", {
        ProjectID,
        ClientID,
        ProjectName,
        Description,
        StartDate,
        Deadline
    });

    if (!ProjectName || typeof ProjectName !== "string" || ProjectName.trim() === "") {
        return res.status(400).json({ error: 'ProjectName is required and must be a non-empty string' });
    }

    try {
        await db.promise().query(
            "INSERT INTO project (ProjectID, ClientID, ProjectName, Description, StartDate, Deadline) VALUES (?, ?, ?, ?, ?, ?)",
            [
                ProjectID,
                ClientID || null,
                ProjectName.trim(),
                Description || null,
                StartDate,
                Deadline
            ]
        );
        const [newProject] = await db.promise().query(
            "SELECT p.*, c.ClientName FROM project p LEFT JOIN client c ON p.ClientID = c.ClientID WHERE p.ProjectID = ?",
            [ProjectID]
        );
        console.log("Project added to database:", newProject[0]);
        res.status(201).json({ message: "Project added", ProjectID });
    } catch (error) {
        console.error("Error adding project to database:", error.message);
        res.status(500).json({ error: 'Failed to add project' });
    }
});

// Sửa dự án
router.put("/projects/:projectId", authenticateSession, async (req, res) => {
    const { projectId } = req.params;
    const { ClientID, ProjectName, Description, StartDate, Deadline } = req.body;
    console.log("Received update project request:", {
        projectId,
        ClientID,
        ProjectName,
        Description,
        StartDate,
        Deadline
    });

    if (!ProjectName || typeof ProjectName !== "string" || ProjectName.trim() === "") {
        return res.status(400).json({ error: 'ProjectName is required and must be a non-empty string' });
    }

    try {
        const [result] = await db.promise().query(
            "UPDATE project SET ClientID = ?, ProjectName = ?, Description = ?, StartDate = ?, Deadline = ? WHERE ProjectID = ?",
            [
                ClientID || null,
                ProjectName.trim(),
                Description || null,
                StartDate,
                Deadline,
                projectId
            ]
        );
        if (result.affectedRows === 0) {
            console.log("No project found with ProjectID:", projectId);
            return res.status(404).json({ error: "Project not found" });
        }
        console.log("Project updated in database:", {
            projectId,
            ClientID,
            ProjectName,
            Description,
            StartDate,
            Deadline
        });
        res.json({ message: "Project updated" });
    } catch (error) {
        console.error("Error updating project:", error.message);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Xóa dự án
router.delete("/projects/:projectId", authenticateSession, async (req, res) => {
    const { projectId } = req.params;
    console.log("Deleting project:", projectId);

    try {
        const [result] = await db.promise().query("DELETE FROM project WHERE ProjectID = ?", [projectId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Project not found" });
        }
        res.json({ message: "Project deleted" });
    } catch (error) {
        console.error("Error deleting project:", error.message);
        res.status(500).json({ error: "Failed to delete project" });
    }
});

// Thêm thành viên vào team
router.post('/team_members', authenticateSession, async (req, res) => {
    const { TeamID, UserID } = req.body;
    console.log('Adding member to team:', { TeamID, UserID });

    try {
        const [result] = await db.promise().query(
            'INSERT INTO team_members (TeamID, UserID) VALUES (?, ?)',
            [TeamID, UserID]
        );
        console.log('Insert result:', result);
        res.json({ message: 'Member added to team' });
    } catch (error) {
        console.error('Error adding member to team:', error.message);
        res.status(500).json({ error: 'Failed to add member to team' });
    }
});

// Lấy danh sách team
router.get('/teams', authenticateSession, async (req, res) => {
    try {
        const [teams] = await db.promise().query(`
            SELECT t.*, GROUP_CONCAT(u.FullName) AS Members
            FROM team t
            LEFT JOIN team_members tm ON t.TeamID = tm.TeamID
            LEFT JOIN user u ON tm.UserID = u.UserID
            GROUP BY t.TeamID
        `);
        console.log('Teams fetched from DB:', teams);
        const formattedTeams = teams.map(team => ({
            ...team,
            Members: team.Members ? team.Members.split(',') : []
        }));
        res.json(formattedTeams);
    } catch (error) {
        console.error('Error fetching teams:', error.message);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Xóa thành viên khỏi team
router.delete('/team_members', authenticateSession, async (req, res) => {
    const { TeamID, UserID } = req.body;
    console.log('Removing member from team:', { TeamID, UserID });

    try {
        const [result] = await db.promise().query(
            'DELETE FROM team_members WHERE TeamID = ? AND UserID = ?',
            [TeamID, UserID]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Team member not found' });
        }
        res.json({ message: 'Member removed from team' });
    } catch (error) {
        console.error('Error removing member from team:', error.message);
        res.status(500).json({ error: 'Failed to remove member from team' });
    }
});

module.exports = router;