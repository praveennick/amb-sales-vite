import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import AdminLink from "../AdminLink";

const AppLayout = ({ user, handleLogout, fallbackImage }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className={`App ${sidebarOpen ? "sidebar-open" : ""}`}>
            {user && (
                <>
                    <div className="navbar">
                        <span className="material-symbols-outlined hamburger" onClick={toggleSidebar}>
                            {sidebarOpen ? "close" : "dehaze"}
                        </span>
                        <div className="user-info">
                            <img src={user.photoURL ? user.photoURL : fallbackImage} alt="User" className="user-image" />
                        </div>
                    </div>
                    <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
                        <nav className="nav">
                            <ul>
                                <AdminLink user={user}>
                                    <li>
                                        <Link to="/dashboard" onClick={toggleSidebar}>
                                            Dashboard
                                        </Link>
                                    </li>
                                </AdminLink>
                                <li>
                                    <Link to="/submit/juice-hut" onClick={toggleSidebar}>
                                        The Juice Hut
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/submit/bubble-tea" onClick={toggleSidebar}>
                                        Bubble Tea N Cotton Candy
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/submit/coffee-candy" onClick={toggleSidebar}>
                                        Coffee N Candy
                                    </Link>
                                </li>
                                <AdminLink user={user}>
                                    <li>
                                        <Link to="/testing" onClick={toggleSidebar}>
                                            Testing
                                        </Link>
                                    </li>
                                </AdminLink>
                                {/* <AdminLink user={user}>
                                    <li>
                                        <Link to="/data" onClick={toggleSidebar}>
                                            Data Upload
                                        </Link>
                                    </li>
                                </AdminLink> */}
                                <AdminLink user={user}>
                                    <li>
                                        <Link to="/daily-spends" onClick={toggleSidebar}>
                                            Daily Spends
                                        </Link>
                                    </li>
                                </AdminLink>
                                <AdminLink user={user}>
                                    <li>
                                        <Link to="/inventory" onClick={toggleSidebar}>
                                            Inventory
                                        </Link>
                                    </li>
                                </AdminLink>
                                <li style={{ marginTop: '40px' }}>
                                    <button
                                        onClick={handleLogout}
                                        className="logout-btn"
                                        style={{ padding: '10px 20px', color: '#000', borderRadius: '5px', fontSize: '16px', marginTop: '10px', background: 'none', border: '1px solid lightgrey', cursor: 'pointer' }}
                                    >
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </>
            )}
            <div className="content">
                <Outlet />
            </div>
        </div>
    );
};

export default AppLayout;
