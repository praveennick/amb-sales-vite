import React from "react";
import { Link } from "react-router-dom";
import './ShopSelection.css'

const ShopSelection = () => {
    const shops = [
        { name: "The Juice Hut", path: "/submit/juice-hut" },
        { name: "Bubble Tea N Cotton Candy", path: "/submit/bubble-tea" },
        { name: "Coffee N Candy", path: "/submit/coffee-candy" },
    ];

    return (
        <div className="shop-selection-container">
            <h2>Select a Shop</h2>
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
