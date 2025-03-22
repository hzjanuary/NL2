import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './TeamList.css';

const TeamList = () => {
    const [teams, setTeams] = useState([]);
    const [newTeam, setNewTeam] = useState({
        TeamName: '',
        Description: '',
        MemberIDs: []
    });
    const [users, setUsers] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [editingTeam, setEditingTeam] = useState(null);
    const [addingMemberTeam, setAddingMemberTeam] = useState(null);

    // Lấy sessionId từ localStorage
    const sessionId = localStorage.getItem('sessionId');

    // Hàm fetch dữ liệu với sessionId trong header
    const fetchWithAuth = async (url, method = 'get', data = null) => {
        try {
            if (!sessionId) {
                throw new Error('Session ID is missing. Please log in again.');
            }

            const config = {
                headers: { 'x-session-id': sessionId }
            };

            let response;
            if (method === 'get') {
                response = await axios.get(url, config);
            } else if (method === 'post') {
                response = await axios.post(url, data, config);
            } else if (method === 'delete') {
                response = await axios.delete(url, { ...config, data });
            }

            return response.data;
        } catch (error) {
            console.error(`Error in ${method.toUpperCase()} ${url}:`, error.response?.data || error.message);
            throw error;
        }
    };

    // Fetch teams và users khi component mount
    useEffect(() => {
        if (!sessionId) {
            setErrorMessage('Session ID is missing. Please log in again.');
            return;
        }

        // Fetch teams
        fetchWithAuth('http://localhost:5000/api/teams')
            .then(data => {
                const formattedTeams = data.map(team => ({
                    ...team,
                    Members: team.Members || []
                }));
                setTeams(formattedTeams);
                setErrorMessage('');
            })
            .catch(error => {
                setErrorMessage('Error fetching teams: ' + (error.response?.data?.error || error.message));
            });

        // Fetch users
        fetchWithAuth('http://localhost:5000/api/users')
            .then(data => {
                setUsers(data);
                setErrorMessage('');
            })
            .catch(error => {
                setErrorMessage('Error fetching users: ' + (error.response?.data?.error || error.message));
            });
    }, [sessionId]); // Thêm sessionId vào dependency array

    // Thêm team mới
    const handleAddTeam = async (e) => {
        e.preventDefault();
        if (!sessionId) {
            setErrorMessage('Session ID is missing. Please log in again.');
            return;
        }

        const teamData = {
            TeamName: newTeam.TeamName,
            Description: newTeam.Description
        };

        try {
            const response = await fetchWithAuth('http://localhost:5000/api/teams', 'post', teamData);
            const newTeamId = response.TeamID;

            // Thêm members vào team mới
            const memberPromises = newTeam.MemberIDs.map(userId =>
                fetchWithAuth('http://localhost:5000/api/team_members', 'post', {
                    TeamID: newTeamId,
                    UserID: userId
                })
            );

            await Promise.all(memberPromises);

            // Làm mới danh sách teams
            const updatedTeams = await fetchWithAuth('http://localhost:5000/api/teams');
            const formattedTeams = updatedTeams.map(team => ({
                ...team,
                Members: team.Members || []
            }));
            setTeams(formattedTeams);
            setNewTeam({ TeamName: '', Description: '', MemberIDs: [] });
            setErrorMessage('');
            setSuccessMessage('Team added successfully');
        } catch (error) {
            setErrorMessage('Error adding team: ' + (error.response?.data?.error || error.message));
        }
    };

    // Xử lý thay đổi danh sách members khi tạo team mới
    const handleMemberChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
        setNewTeam({ ...newTeam, MemberIDs: selectedOptions });
    };

    // Mở form thêm member
    const handleAddMember = (team) => {
        setAddingMemberTeam({
            ...team,
            Members: team.Members || [],
            newMemberId: ''
        });
    };

    // Thêm member vào team
    const handleSubmitAddMember = async (e) => {
        e.preventDefault();
        if (!sessionId) {
            setErrorMessage('Session ID is missing. Please log in again.');
            return;
        }

        const newMemberId = addingMemberTeam.newMemberId;
        if (!newMemberId) {
            setErrorMessage('Please select a member to add');
            return;
        }

        try {
            console.log('Submitting new member:', {
                TeamID: addingMemberTeam.TeamID,
                UserID: newMemberId
            });

            await fetchWithAuth('http://localhost:5000/api/team_members', 'post', {
                TeamID: addingMemberTeam.TeamID,
                UserID: newMemberId
            });

            // Làm mới danh sách teams
            const updatedTeams = await fetchWithAuth('http://localhost:5000/api/teams');
            const formattedTeams = updatedTeams.map(team => ({
                ...team,
                Members: team.Members || []
            }));
            console.log('Updated teams:', formattedTeams);
            setTeams(formattedTeams);
            setAddingMemberTeam(null);
            setErrorMessage('');
            setSuccessMessage('Member added successfully');
        } catch (error) {
            setErrorMessage('Error adding member to team: ' + (error.response?.data?.error || error.message));
        }
    };

    // Mở form sửa danh sách members
    const handleEditMembers = (team) => {
        setEditingTeam({
            ...team,
            Members: team.Members || [],
            MemberIDs: team.Members.map(member => {
                const user = users.find(u => u.FullName === member);
                return user ? user.UserID : null;
            }).filter(id => id !== null)
        });
    };

    // Cập nhật danh sách members
    const handleUpdateMembers = async (e) => {
        e.preventDefault();
        if (!sessionId) {
            setErrorMessage('Session ID is missing. Please log in again.');
            return;
        }

        try {
            // Xóa tất cả members cũ
            const deletePromises = editingTeam.Members.map(member => {
                const user = users.find(u => u.FullName === member);
                if (user) {
                    return fetchWithAuth('http://localhost:5000/api/team_members', 'delete', {
                        TeamID: editingTeam.TeamID,
                        UserID: user.UserID
                    });
                }
                return Promise.resolve();
            });

            await Promise.all(deletePromises);

            // Thêm lại danh sách members mới
            const addPromises = editingTeam.MemberIDs.map(userId =>
                fetchWithAuth('http://localhost:5000/api/team_members', 'post', {
                    TeamID: editingTeam.TeamID,
                    UserID: userId
                })
            );

            await Promise.all(addPromises);

            // Làm mới danh sách teams
            const updatedTeams = await fetchWithAuth('http://localhost:5000/api/teams');
            const formattedTeams = updatedTeams.map(team => ({
                ...team,
                Members: team.Members || []
            }));
            setTeams(formattedTeams);
            setEditingTeam(null);
            setErrorMessage('');
            setSuccessMessage('Members updated successfully');
        } catch (error) {
            setErrorMessage('Error updating members: ' + (error.response?.data?.error || error.message));
        }
    };

    // Xóa member khỏi team
    const handleRemoveMember = async (teamId, userId) => {
        if (!sessionId) {
            setErrorMessage('Session ID is missing. Please log in again.');
            return;
        }

        try {
            await fetchWithAuth('http://localhost:5000/api/team_members', 'delete', {
                TeamID: teamId,
                UserID: userId
            });

            // Làm mới danh sách teams
            const updatedTeams = await fetchWithAuth('http://localhost:5000/api/teams');
            const formattedTeams = updatedTeams.map(team => ({
                ...team,
                Members: team.Members || []
            }));
            setTeams(formattedTeams);

            if (editingTeam) {
                setEditingTeam({
                    ...editingTeam,
                    MemberIDs: editingTeam.MemberIDs.filter(id => id !== userId),
                    Members: editingTeam.Members.filter(member => {
                        const user = users.find(u => u.FullName === member);
                        return user && user.UserID !== userId;
                    })
                });
            }

            setErrorMessage('');
            setSuccessMessage('Member removed successfully');
        } catch (error) {
            setErrorMessage('Error removing member from team: ' + (error.response?.data?.error || error.message));
        }
    };

    const validUsers = users.filter(user => user.FullName && user.FullName.trim() !== '');

    return (
        <div className="team-list-container">
            <div className="notification-container">
                {errorMessage && (
                    <p className="error-message">{errorMessage}</p>
                )}
                {successMessage && (
                    <p className="success-message">{successMessage}</p>
                )}
            </div>

            <h2>Teams</h2>
            {teams.length === 0 ? (
                <p className="no-data">No teams available</p>
            ) : (
                <div className="team-list">
                    {teams.map(team => (
                        <div key={team.TeamID} className="team-item">
                            <span>{team.TeamName}</span>
                            <span>{team.Description || 'No description'}</span>
                            <span>Members: {team.Members?.join(', ') || 'No members'}</span>
                            <div className="team-actions">
                                <button className="edit-btn" onClick={() => handleAddMember(team)}>Add Member</button>
                                <button className="edit-btn" onClick={() => handleEditMembers(team)}>Edit Members</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {addingMemberTeam && (
                <div className="edit-form-container">
                    <h3>Add Member to {addingMemberTeam.TeamName}</h3>
                    <form className="team-form" onSubmit={handleSubmitAddMember}>
                        <select
                            value={addingMemberTeam.newMemberId || ''}
                            onChange={(e) => setAddingMemberTeam({ ...addingMemberTeam, newMemberId: e.target.value })}
                        >
                            <option value="">Select a member</option>
                            {validUsers
                                .filter(user => !(addingMemberTeam.Members || []).includes(user.FullName))
                                .map(user => (
                                    <option key={user.UserID} value={user.UserID}>
                                        {user.FullName}
                                    </option>
                                ))}
                        </select>
                        <button type="submit">Add Member</button>
                        <button type="button" className="cancel-btn" onClick={() => setAddingMemberTeam(null)}>Cancel</button>
                    </form>
                </div>
            )}

            {editingTeam && (
                <div className="edit-form-container">
                    <h3>Edit Members of {editingTeam.TeamName}</h3>
                    <form className="team-form" onSubmit={handleUpdateMembers}>
                        <select
                            multiple
                            value={editingTeam.MemberIDs}
                            onChange={(e) => {
                                const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                                setEditingTeam({ ...editingTeam, MemberIDs: selectedOptions });
                            }}
                        >
                            <option value="" disabled>Select members</option>
                            {validUsers.map(user => (
                                <option key={user.UserID} value={user.UserID}>
                                    {user.FullName}
                                </option>
                            ))}
                        </select>
                        <button type="submit">Update Members</button>
                        <button type="button" className="cancel-btn" onClick={() => setEditingTeam(null)}>Cancel</button>
                    </form>
                    <h4>Current Members</h4>
                    <ul>
                        {editingTeam.MemberIDs.map(userId => {
                            const user = validUsers.find(u => u.UserID === userId);
                            return user ? (
                                <li key={userId}>
                                    {user.FullName}
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleRemoveMember(editingTeam.TeamID, userId)}
                                    >
                                        Remove
                                    </button>
                                </li>
                            ) : null;
                        })}
                    </ul>
                </div>
            )}

            <h3>Create New Team</h3>
            <form className="team-form" onSubmit={handleAddTeam}>
                <input
                    type="text"
                    placeholder="Team Name"
                    value={newTeam.TeamName}
                    onChange={(e) => setNewTeam({ ...newTeam, TeamName: e.target.value })}
                    required
                />
                <textarea
                    placeholder="Description"
                    value={newTeam.Description}
                    onChange={(e) => setNewTeam({ ...newTeam, Description: e.target.value })}
                />
                <select
                    multiple
                    value={newTeam.MemberIDs}
                    onChange={handleMemberChange}
                >
                    <option value="" disabled>Select members</option>
                    {validUsers.length === 0 ? (
                        <option value="" disabled>No users available</option>
                    ) : (
                        validUsers.map(user => (
                            <option key={user.UserID} value={user.UserID}>
                                {user.FullName}
                            </option>
                        ))
                    )}
                </select>
                <button type="submit">Create Team</button>
            </form>
        </div>
    );
};

export default TeamList;