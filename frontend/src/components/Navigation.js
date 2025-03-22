import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => (
    <nav className="nav-bar">
        <NavLink
            to="/projects"
            className="nav-link"
            activeClassName="active"
        >
            Projects
        </NavLink>
        <NavLink
            to="/teams"
            className="nav-link"
            activeClassName="active"
        >
            Teams
        </NavLink>
        <NavLink
            to="/timelog"
            className="nav-link"
            activeClassName="active"
        >
            Time Log
        </NavLink>
    </nav>
);

export default Navigation;