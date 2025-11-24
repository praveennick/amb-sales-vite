import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import AdminLink from "../AdminLink";

const AppLayout = ({ user, handleLogout, fallbackImage }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [pageTitle, setPageTitle] = useState("Dashboard");


    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className={`App ${sidebarOpen ? "sidebar-open" : ""}`}>
            {user && (
                <>
                    <div className="navbar">
                        <span className="material-symbols-outlined hamburger" onClick={toggleSidebar}>
                            {sidebarOpen ? <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#1f1f1f"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#1f1f1f"><path d="M120-680v-80h720v80H120Zm0 480v-80h720v80H120Zm0-240v-80h720v80H120Z" /></svg>}
                        </span>
                        <span className="text-2xl font-bold">{pageTitle}</span>
                        <div className="user-info">
                            <img src={user.photoURL ? user.photoURL : fallbackImage} alt="User" className="user-image" />
                        </div>
                    </div>
                    <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
                        <nav className="nav">
                            <ul>
                                <AdminLink user={user}>
                                    <li>
                                        <Link to="/dashboard" onClick={() => { setPageTitle("Dashboard"); toggleSidebar(); }}>
                                            Dashboard
                                        </Link>
                                    </li>
                                </AdminLink>
                                <li>
                                    <Link to="/submit/juice-hut" onClick={() => { setPageTitle("The Juice Hut"); toggleSidebar(); }}>
                                        The Juice Hut
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/submit/bubble-tea" onClick={() => { setPageTitle("Bubble Tea"); toggleSidebar(); }}>
                                        Bubble Tea N Cotton Candy
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/submit/coffee-candy" onClick={() => { setPageTitle("Coffee N Candy"); toggleSidebar(); }}>
                                        Coffee N Candy
                                    </Link>
                                </li>
                                <AdminLink user={user}>
                                    <li>
                                        <Link to="/testing" onClick={() => { setPageTitle("Testing"); toggleSidebar(); }}>
                                            Testing
                                        </Link>
                                    </li>
                                </AdminLink>
                                {/* <AdminLink user={user}>
                                    <li>
                                        <Link to="/data" onClick={() => { setPageTitle("Data Upload"); toggleSidebar(); }}>
                                            Data Upload
                                        </Link>
                                    </li>
                                </AdminLink> */}
                                <AdminLink user={user}>
                                    <li>
                                        <Link to="/daily-spends" onClick={() => { setPageTitle("Daily Spends"); toggleSidebar(); }}>
                                            Daily Spends
                                        </Link>
                                    </li>
                                </AdminLink>
                                <AdminLink user={user}>
                                    <li>
                                        <Link to="/inventory" onClick={() => { setPageTitle("Inventory"); toggleSidebar(); }}>
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
