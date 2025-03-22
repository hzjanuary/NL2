import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ProjectList.css';

// Hàm định dạng ngày thành dd/mm/yyyy
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Hàm lấy ngày hiện tại định dạng yyyy-mm-dd
const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [newProject, setNewProject] = useState({
        ClientID: '',
        ProjectName: '',
        Description: '',
        StartDate: getCurrentDate(),
        Deadline: ''
    });
    const [newClient, setNewClient] = useState('');
    const [editProject, setEditProject] = useState(null);
    const [editClient, setEditClient] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const sessionId = localStorage.getItem('sessionId');
        console.log('Fetching projects and clients with sessionId:', sessionId);
        if (!sessionId) {
            setErrorMessage('Session ID is missing. Please log in again.');
            return;
        }

        axios.get('http://localhost:5000/api/projects', {
            headers: { 'x-session-id': sessionId }
        })
            .then(response => {
                console.log('Projects fetched:', response.data);
                setProjects(response.data);
                setErrorMessage('');
            })
            .catch(error => {
                console.error('Error fetching projects:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                if (error.response?.status === 401) {
                    setErrorMessage('Session invalid or expired. Please log in again.');
                    localStorage.removeItem('sessionId');
                    // Chuyển hướng đến trang đăng nhập nếu cần
                } else {
                    setErrorMessage(error.response?.data?.message || 'Error fetching projects');
                }
            });

        axios.get('http://localhost:5000/api/clients', {
            headers: { 'x-session-id': sessionId }
        })
            .then(response => {
                console.log('Clients fetched:', response.data);
                setClients(response.data);
                setErrorMessage('');
            })
            .catch(error => {
                console.error('Error fetching clients:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                if (error.response?.status === 401) {
                    setErrorMessage('Session invalid or expired. Please log in again.');
                    localStorage.removeItem('sessionId');
                    // Chuyển hướng đến trang đăng nhập nếu cần
                } else {
                    setErrorMessage(error.response?.data?.message || 'Error fetching clients');
                }
            });
    }, []);

    const refreshProjects = () => {
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
            setErrorMessage('Session ID is missing. Please log in again.');
            return;
        }

        axios.get('http://localhost:5000/api/projects', {
            headers: { 'x-session-id': sessionId }
        })
            .then(response => {
                console.log('Projects fetched:', response.data);
                setProjects(response.data);
                setErrorMessage('');
                setSuccessMessage('Projects refreshed successfully');
            })
            .catch(error => {
                console.error('Error fetching projects:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                if (error.response?.status === 401) {
                    setErrorMessage('Session invalid or expired. Please log in again.');
                    localStorage.removeItem('sessionId');
                    // Chuyển hướng đến trang đăng nhập nếu cần
                } else {
                    setErrorMessage(error.response?.data?.message || 'Error fetching projects');
                }
            });
    };

    const refreshClients = () => {
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
            setErrorMessage('Session ID is missing. Please log in again.');
            return;
        }

        axios.get('http://localhost:5000/api/clients', {
            headers: { 'x-session-id': sessionId }
        })
            .then(response => {
                console.log('Clients fetched:', response.data);
                setClients(response.data);
                setErrorMessage('');
                setSuccessMessage('Clients refreshed successfully');
            })
            .catch(error => {
                console.error('Error fetching clients:', error.response?.data || error.message);
                setErrorMessage(error.response?.data?.message || 'Error fetching clients');
            });
    };

    const handleAddClient = (e) => {
        e.preventDefault();
        const sessionId = localStorage.getItem('sessionId');
        console.log('Sending add client request with sessionId:', sessionId, 'Data:', { ClientName: newClient });
        axios.post('http://localhost:5000/api/clients', { ClientName: newClient }, {
            headers: { 'x-session-id': sessionId }
        })
            .then(response => {
                console.log('Client added:', response.data);
                setClients([...clients, { ClientID: response.data.ClientID, ClientName: newClient }]);
                setNewClient('');
                setErrorMessage('');
                setSuccessMessage('Client added successfully');
            })
            .catch(error => {
                console.error('Error adding client:', error.response?.data || error.message);
                setErrorMessage(error.response?.data?.message || 'Error adding client');
            });
    };

    const handleEditClient = (client) => {
        console.log('Editing client:', client);
        setEditClient(client);
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleUpdateClient = (e) => {
        e.preventDefault();
        const sessionId = localStorage.getItem('sessionId');
        console.log('Preparing to update client:', {
            ClientID: editClient.ClientID,
            ClientName: editClient.ClientName,
            sessionId: sessionId
        });

        if (!editClient.ClientID || !editClient.ClientName) {
            console.error('Missing required fields:', { editClient });
            setErrorMessage('ClientID or ClientName is missing');
            return;
        }

        if (!sessionId) {
            console.error('No sessionId found in localStorage');
            setErrorMessage('Session ID is missing. Please log in again.');
            return;
        }

        console.log('Sending update client request to URL:', `http://localhost:5000/api/clients/${editClient.ClientID}`);
        axios.put(`http://localhost:5000/api/clients/${editClient.ClientID}`, { ClientName: editClient.ClientName }, {
            headers: { 'x-session-id': sessionId }
        })
            .then(response => {
                console.log('Client updated successfully:', response.data);
                setClients(clients.map(c => (c.ClientID === editClient.ClientID ? { ...c, ClientName: editClient.ClientName } : c)));
                setEditClient(null);
                setErrorMessage('');
                setSuccessMessage('Client updated successfully');
            })
            .catch(error => {
                console.error('Error updating client:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                if (error.response?.status === 401) {
                    setErrorMessage('Session invalid or expired. Please log in again.');
                    localStorage.removeItem('sessionId');
                    // Chuyển hướng đến trang đăng nhập nếu cần
                } else {
                    setErrorMessage(error.response?.data?.message || 'Error updating client');
                }
            });
    };

    const handleDeleteClient = (clientId) => {
        const sessionId = localStorage.getItem('sessionId');
        console.log('Deleting client:', clientId);
        if (!sessionId) {
            console.error('No sessionId found in localStorage');
            setErrorMessage('Session ID is missing. Please log in again.');
            return;
        }

        axios.delete(`http://localhost:5000/api/clients/${clientId}`, {
            headers: { 'x-session-id': sessionId }
        })
            .then(() => {
                console.log('Client deleted');
                axios.get('http://localhost:5000/api/clients', {
                    headers: { 'x-session-id': sessionId }
                })
                    .then(response => {
                        console.log('Clients fetched:', response.data);
                        setClients(response.data);
                        setErrorMessage('');
                        setSuccessMessage('Client deleted successfully');
                    })
                    .catch(error => {
                        console.error('Error fetching clients:', error.response?.data || error.message);
                        setErrorMessage(error.response?.data?.message || 'Error fetching clients');
                    });
            })
            .catch(error => {
                console.error('Error deleting client:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                if (error.response?.status === 401) {
                    setErrorMessage('Session invalid or expired. Please log in again.');
                    localStorage.removeItem('sessionId');
                } else {
                    setErrorMessage(error.response?.data?.message || 'Error deleting client');
                }
            });
    };

    const handleAddProject = (e) => {
        e.preventDefault();
        const sessionId = localStorage.getItem('sessionId');
        console.log('Sending add project request with sessionId:', sessionId, 'Data:', newProject);
        axios.post('http://localhost:5000/api/projects', newProject, {
            headers: { 'x-session-id': sessionId }
        })
            .then(response => {
                console.log('Project added:', response.data);
                axios.get('http://localhost:5000/api/projects', {
                    headers: { 'x-session-id': sessionId }
                })
                    .then(res => {
                        console.log('Updated projects fetched:', res.data);
                        setProjects(res.data);
                        setNewProject({
                            ClientID: '',
                            ProjectName: '',
                            Description: '',
                            StartDate: getCurrentDate(),
                            Deadline: ''
                        });
                        setErrorMessage('');
                        setSuccessMessage('Project added successfully');
                    });
            })
            .catch(error => {
                console.error('Error adding project:', error.response?.data || error.message);
                setErrorMessage(error.response?.data?.message || 'Error adding project');
            });
    };

    const handleEditProject = (project) => {
        console.log('Editing project:', project);
        setEditProject({
            ...project,
            StartDate: project.StartDate.split('T')[0],
            Deadline: project.Deadline.split('T')[0]
        });
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleUpdateProject = (e) => {
        e.preventDefault();
        const sessionId = localStorage.getItem('sessionId');
        const updatedProject = {
            ClientID: editProject.ClientID || null,
            ProjectName: editProject.ProjectName,
            Description: editProject.Description || null,
            StartDate: editProject.StartDate,
            Deadline: editProject.Deadline
        };
        console.log('Sending update project request:', {
            ProjectID: editProject.ProjectID,
            sessionId,
            data: updatedProject
        });
        axios.put(`http://localhost:5000/api/projects/${editProject.ProjectID}`, updatedProject, {
            headers: { 'x-session-id': sessionId }
        })
            .then(response => {
                console.log('Update response:', response.data);
                axios.get('http://localhost:5000/api/projects', {
                    headers: { 'x-session-id': sessionId }
                })
                    .then(res => {
                        console.log('Updated projects fetched:', res.data);
                        setProjects(res.data);
                        setEditProject(null);
                        setErrorMessage('');
                        setSuccessMessage('Project updated successfully');
                    });
            })
            .catch(error => {
                console.error('Error updating project:', error.response?.data || error.message);
                setErrorMessage(error.response?.data?.message || 'Error updating project');
            });
    };

    const handleDeleteProject = (projectId) => {
        const sessionId = localStorage.getItem('sessionId');
        console.log('Deleting project:', projectId);
        axios.delete(`http://localhost:5000/api/projects/${projectId}`, {
            headers: { 'x-session-id': sessionId }
        })
            .then(() => {
                console.log('Project deleted');
                setProjects(projects.filter(p => p.ProjectID !== projectId));
                setErrorMessage('');
                setSuccessMessage('Project deleted successfully');
            })
            .catch(error => {
                console.error('Error deleting project:', error.response?.data || error.message);
                setErrorMessage(error.response?.data?.message || 'Error deleting project');
            });
    };

    return (
        <div className="project-list-container">
            {/* Khối thông báo gộp ở góc trái */}
            <div className="notification-container">
                {errorMessage && (
                    <p className="error-message">{errorMessage}</p>
                )}
                {successMessage && (
                    <p className="success-message">{successMessage}</p>
                )}
            </div>

            <h2>Projects</h2>
            <button className="refresh-button" onClick={refreshProjects}>Refresh Projects</button> {/* Thêm className */}

            {projects.length === 0 ? (
                <p className="no-data">No projects available</p>
            ) : (
                <table className="project-table">
                    <thead>
                        <tr>
                            <th>Project ID</th>
                            <th>Project Name</th>
                            <th>Client Name</th>
                            <th>Description</th>
                            <th>Start Date</th>
                            <th>Deadline</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(project => (
                            <tr key={project.ProjectID}>
                                <td>{project.ProjectID}</td>
                                <td>{project.ProjectName}</td>
                                <td>{project.ClientName || 'No client'}</td>
                                <td>{project.Description || 'No description'}</td>
                                <td>{formatDate(project.StartDate)}</td>
                                <td>{formatDate(project.Deadline)}</td>
                                <td>
                                    <button className="edit-btn" onClick={() => handleEditProject(project)}>Edit</button>
                                    <button className="delete-btn" onClick={() => handleDeleteProject(project.ProjectID)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {editProject && (
                <div className="edit-form-container">
                    <h3>Edit Project</h3>
                    <form className="project-form" onSubmit={handleUpdateProject}>
                        <select
                            value={editProject.ClientID || ''}
                            onChange={(e) => setEditProject({ ...editProject, ClientID: e.target.value })}
                        >
                            <option value="">Select a client</option>
                            {clients.map(client => (
                                <option key={client.ClientID} value={client.ClientID}>
                                    {client.ClientName}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={editProject.ProjectName}
                            onChange={(e) => setEditProject({ ...editProject, ProjectName: e.target.value })}
                            required
                        />
                        <textarea
                            value={editProject.Description}
                            onChange={(e) => setEditProject({ ...editProject, Description: e.target.value })}
                        />
                        <input
                            type="date"
                            value={editProject.StartDate}
                            onChange={(e) => setEditProject({ ...editProject, StartDate: e.target.value })}
                            required
                        />
                        <input
                            type="date"
                            value={editProject.Deadline}
                            onChange={(e) => setEditProject({ ...editProject, Deadline: e.target.value })}
                            required
                        />
                        <button type="submit">Update Project</button>
                        <button type="button" className="cancel-btn" onClick={() => setEditProject(null)}>Cancel</button>
                    </form>
                </div>
            )}

            <h3>Clients</h3>
            <button className="refresh-button" onClick={refreshClients}>Refresh Clients</button> {/* Thêm className */}
            <form className="client-form" onSubmit={handleAddClient}>
                <input
                    type="text"
                    placeholder="New Client Name"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    required
                />
                <button type="submit">Add Client</button>
            </form>

            {clients.length === 0 ? (
                <p className="no-data">No clients available</p>
            ) : (
                <ul className="client-list">
                    {clients.map(client => (
                        <li key={client.ClientID} className="client-item">
                            {client.ClientName}
                            <div className="client-actions">
                                <button className="edit-btn" onClick={() => handleEditClient(client)}>Edit</button>
                                <button className="delete-btn" onClick={() => handleDeleteClient(client.ClientID)}>Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {editClient && (
                <div className="edit-client-container">
                    <h4>Edit Client</h4>
                    <form className="client-form" onSubmit={handleUpdateClient}>
                        <input
                            type="text"
                            value={editClient.ClientName}
                            onChange={(e) => setEditClient({ ...editClient, ClientName: e.target.value })}
                            required
                        />
                        <button type="submit">Update Client</button>
                        <button type="button" className="cancel-btn" onClick={() => setEditClient(null)}>Cancel</button>
                    </form>
                </div>
            )}

            <h3>Add Project</h3>
            <form className="project-form" onSubmit={handleAddProject}>
                <select
                    value={newProject.ClientID}
                    onChange={(e) => setNewProject({ ...newProject, ClientID: e.target.value })}
                >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                        <option key={client.ClientID} value={client.ClientID}>
                            {client.ClientName}
                        </option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Project Name"
                    value={newProject.ProjectName}
                    onChange={(e) => setNewProject({ ...newProject, ProjectName: e.target.value })}
                    required
                />
                <textarea
                    placeholder="Description"
                    value={newProject.Description}
                    onChange={(e) => setNewProject({ ...newProject, Description: e.target.value })}
                />
                <input
                    type="date"
                    value={newProject.StartDate}
                    onChange={(e) => setNewProject({ ...newProject, StartDate: e.target.value })}
                    required
                />
                <input
                    type="date"
                    value={newProject.Deadline}
                    onChange={(e) => setNewProject({ ...newProject, Deadline: e.target.value })}
                    required
                />
                <button type="submit">Add Project</button>
            </form>
        </div>
    );
};

export default ProjectList;