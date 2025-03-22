import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './TimeLog.css';

// Hàm định dạng ngày giờ thành dd/mm/yyyy HH:MM
const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Hàm lấy ngày giờ hiện tại định dạng yyyy-mm-ddThh:mm
const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const TimeLog = () => {
    const [timeLogs, setTimeLogs] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [newTimeLog, setNewTimeLog] = useState({
        TaskID: '',
        UserID: '',
        StartTime: getCurrentDateTime(),
        EndTime: getCurrentDateTime()
    });
    const [editTimeLog, setEditTimeLog] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const sessionId = localStorage.getItem('sessionId');
        console.log('Fetching time logs with sessionId:', sessionId);
        if (!sessionId) {
            setErrorMessage('Session ID is missing. Please log in again.');
            return;
        }

        // Lấy danh sách time_log
        axios.get('http://localhost:5000/api/time_logs', {
            headers: { 'x-session-id': sessionId }
        })
            .then(response => {
                console.log('Time logs fetched:', response.data);
                setTimeLogs(response.data);
            })
            .catch(error => {
                console.error('Error fetching time logs:', error.response?.data || error.message);
                setErrorMessage(error.response?.data?.message || 'Error fetching time logs');
            });

        // Lấy danh sách task
        console.log('Sending request to fetch tasks with sessionId:', sessionId);
        axios.get('http://localhost:5000/api/tasks', {
            headers: { 'x-session-id': sessionId }
        })
            .then(response => {
                console.log('Tasks fetched successfully:', response.data);
                setTasks(response.data);
            })
            .catch(error => {
                console.error('Error fetching tasks:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                setErrorMessage(error.response?.data?.message || 'Error fetching tasks');
            });

        // Lấy danh sách user
        axios.get('http://localhost:5000/api/users', {
            headers: { 'x-session-id': sessionId }
        })
            .then(response => {
                console.log('Users fetched:', response.data);
                setUsers(response.data);
            })
            .catch(error => {
                console.error('Error fetching users:', error.response?.data || error.message);
                setErrorMessage(error.response?.data?.message || 'Error fetching users');
            });
    }, []);

    const handleAddTimeLog = (e) => {
        e.preventDefault();
        const sessionId = localStorage.getItem('sessionId');
        console.log('Sending add time log request with sessionId:', sessionId, 'Data:', newTimeLog);
        axios.post('http://localhost:5000/api/time_logs', newTimeLog, {
            headers: { 'x-session-id': sessionId }
        })
            .then(response => {
                console.log('Time log added:', response.data);
                axios.get('http://localhost:5000/api/time_logs', {
                    headers: { 'x-session-id': sessionId }
                })
                    .then(res => {
                        console.log('Updated time logs fetched:', res.data);
                        setTimeLogs(res.data);
                        setNewTimeLog({
                            TaskID: '',
                            UserID: '',
                            StartTime: getCurrentDateTime(),
                            EndTime: getCurrentDateTime()
                        });
                        setErrorMessage('');
                    });
            })
            .catch(error => {
                console.error('Error adding time log:', error.response?.data || error.message);
                setErrorMessage(error.response?.data?.message || 'Error adding time log');
            });
    };

    const handleEditTimeLog = (timeLog) => {
        console.log('Editing time log:', timeLog);
        setEditTimeLog({
            ...timeLog,
            StartTime: timeLog.StartTime.split('.')[0],
            EndTime: timeLog.EndTime.split('.')[0]
        });
        setErrorMessage('');
    };

    const handleUpdateTimeLog = (e) => {
        e.preventDefault();
        const sessionId = localStorage.getItem('sessionId');
        const updatedTimeLog = {
            TaskID: editTimeLog.TaskID,
            UserID: editTimeLog.UserID,
            StartTime: editTimeLog.StartTime,
            EndTime: editTimeLog.EndTime
        };
        console.log('Sending update time log request:', { TimeLogID: editTimeLog.TimeLogID, sessionId, data: updatedTimeLog });
        axios.put(`http://localhost:5000/api/time_logs/${editTimeLog.TimeLogID}`, updatedTimeLog, {
            headers: { 'x-session-id': sessionId }
        })
            .then(response => {
                console.log('Update response:', response.data);
                axios.get('http://localhost:5000/api/time_logs', {
                    headers: { 'x-session-id': sessionId }
                })
                    .then(res => {
                        console.log('Updated time logs fetched:', res.data);
                        setTimeLogs(res.data);
                        setEditTimeLog(null);
                        setErrorMessage('');
                    });
            })
            .catch(error => {
                console.error('Error updating time log:', error.response?.data || error.message);
                setErrorMessage(error.response?.data?.message || 'Error updating time log');
            });
    };

    const handleDeleteTimeLog = (timeLogId) => {
        const sessionId = localStorage.getItem('sessionId');
        console.log('Deleting time log:', timeLogId);
        axios.delete(`http://localhost:5000/api/time_logs/${timeLogId}`, {
            headers: { 'x-session-id': sessionId }
        })
            .then(() => {
                console.log('Time log deleted');
                setTimeLogs(timeLogs.filter(tl => tl.TimeLogID !== timeLogId));
                setErrorMessage('');
            })
            .catch(error => {
                console.error('Error deleting time log:', error.response?.data || error.message);
                setErrorMessage(error.response?.data?.message || 'Error deleting time log');
            });
    };

    return (
        <div className="time-log-container">
            <h2>Time Logs</h2>

            {errorMessage && (
                <p className="error-message">{errorMessage}</p>
            )}

            <form className="time-log-form" onSubmit={handleAddTimeLog}>
                <select
                    value={newTimeLog.TaskID}
                    onChange={(e) => setNewTimeLog({ ...newTimeLog, TaskID: e.target.value })}
                    required
                >
                    <option value="">Select a task</option>
                    {tasks.map(task => (
                        <option key={task.TaskID} value={task.TaskID}>
                            {task.TaskName}
                        </option>
                    ))}
                </select>
                <select
                    value={newTimeLog.UserID}
                    onChange={(e) => setNewTimeLog({ ...newTimeLog, UserID: e.target.value })}
                    required
                >
                    <option value="">Select a user</option>
                    {users.map(user => (
                        <option key={user.UserID} value={user.UserID}>
                            {user.FullName}
                        </option>
                    ))}
                </select>
                <input
                    type="datetime-local"
                    value={newTimeLog.StartTime}
                    onChange={(e) => setNewTimeLog({ ...newTimeLog, StartTime: e.target.value })}
                    required
                />
                <input
                    type="datetime-local"
                    value={newTimeLog.EndTime}
                    onChange={(e) => setNewTimeLog({ ...newTimeLog, EndTime: e.target.value })}
                    required
                />
                <button type="submit">Add Time Log</button>
            </form>

            {timeLogs.length === 0 ? (
                <p className="no-data">No time logs available</p>
            ) : (
                <ul className="time-log-list">
                    {timeLogs.map(timeLog => (
                        <li key={timeLog.TimeLogID} className="time-log-item">
                            <span>Task: {timeLog.TaskName} | User: {timeLog.FullName}</span>
                            <span>Start: {formatDateTime(timeLog.StartTime)} | End: {formatDateTime(timeLog.EndTime)} | Hours: {timeLog.TotalHours}</span>
                            <div className="time-log-actions">
                                <button className="edit-btn" onClick={() => handleEditTimeLog(timeLog)}>Edit</button>
                                <button className="delete-btn" onClick={() => handleDeleteTimeLog(timeLog.TimeLogID)}>Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {editTimeLog && (
                <div className="edit-time-log-container">
                    <h3>Edit Time Log</h3>
                    <form className="time-log-form" onSubmit={handleUpdateTimeLog}>
                        <select
                            value={editTimeLog.TaskID}
                            onChange={(e) => setEditTimeLog({ ...editTimeLog, TaskID: e.target.value })}
                            required
                        >
                            <option value="">Select a task</option>
                            {tasks.map(task => (
                                <option key={task.TaskID} value={task.TaskID}>
                                    {task.TaskName}
                                </option>
                            ))}
                        </select>
                        <select
                            value={editTimeLog.UserID}
                            onChange={(e) => setEditTimeLog({ ...editTimeLog, UserID: e.target.value })}
                            required
                        >
                            <option value="">Select a user</option>
                            {users.map(user => (
                                <option key={user.UserID} value={user.UserID}>
                                    {user.FullName}
                                </option>
                            ))}
                        </select>
                        <input
                            type="datetime-local"
                            value={editTimeLog.StartTime}
                            onChange={(e) => setEditTimeLog({ ...editTimeLog, StartTime: e.target.value })}
                            required
                        />
                        <input
                            type="datetime-local"
                            value={editTimeLog.EndTime}
                            onChange={(e) => setEditTimeLog({ ...editTimeLog, EndTime: e.target.value })}
                            required
                        />
                        <button type="submit">Update Time Log</button>
                        <button type="button" className="cancel-btn" onClick={() => setEditTimeLog(null)}>Cancel</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default TimeLog;