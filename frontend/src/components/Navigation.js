import React from 'react';
import { NavLink } from 'react-router-dom';

const Navigation = () => {
    return (
        <nav className="tab-navigation">
            <NavLink
                to="/graph"
                className={({ isActive }) => isActive ? 'tab-link active' : 'tab-link'}
            >
                📊 Graph View
            </NavLink>
            <NavLink
                to="/data"
                className={({ isActive }) => isActive ? 'tab-link active' : 'tab-link'}
            >
                📄 Data View
            </NavLink>
        </nav>
    );
};

export default Navigation;
