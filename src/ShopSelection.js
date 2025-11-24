import React from "react";
import { Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import "./ShopSelection.css";

const ShopSelection = () => {
    const [user] = useAuthState(auth);

    const shops = [
        { name: "The Juice Hut", path: "/submit/juice-hut" },
        { name: "Bubble Tea N Cotton Candy", path: "/submit/bubble-tea" },
        { name: "Coffee N Candy", path: "/submit/coffee-candy" },
    ];
    console.log("user", user)

    return (
        <div className="shop-selection-container">

            {/* WELCOME USER */}
            {user && (
                <h3 className="welcome-text">
                    Welcome, {user.displayName || user.email}
                </h3>
            )}

            <h2>Please Select a Shop</h2>

            <ul className="shop-list">
                {shops.map((shop) => (
                    <li key={shop.name} className="shop-item">
                        <Link to={shop.path}>{shop.name}</Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ShopSelection;
