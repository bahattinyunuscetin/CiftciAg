import React from 'react';
import { NavLink } from 'react-router-dom';
import './AdminNav.css';

const AdminNav = () => {
    return (
        <nav className="admin-nav">
            <ul>
                <li>
                    <NavLink
                        to="/admin"
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        Dashboard
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        Users
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/admin/irrigation-types"
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        Irrigation Types
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/admin/settings"
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        Settings
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
};

export default AdminNav;