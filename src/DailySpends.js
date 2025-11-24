import React, { useState, useEffect, useCallback } from "react";
import {
    db,
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
} from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import moment from "moment";
import StackedColumn from "./components/charts/StackedColumn";
import { FaTrash, FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import LoadingSpinner from "./components/common/LoadingSpinner/LoadingSpinner";

const CARD_COLORS = [
    "#FEF9C3", "#BBF7D0", "#E0E7FF", "#FECACA", "#FDE68A", "#C7D2FE"
];

const DailySpends = () => {
    const [user] = useAuthState(auth);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [spendsForDay, setSpendsForDay] = useState([]);
    const [loading, setLoading] = useState(false);
    const [monthlySpends, setMonthlySpends] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [refresh, setRefresh] = useState(false);

    const daysInMonth = moment(selectedDate).daysInMonth();
    const chartCategories = Array.from({ length: daysInMonth }, (_, i) =>
        moment(selectedDate).date(i + 1).format("DD-MM-YYYY")
    );

    // Fetch daily spends (for selected day)
    const fetchSpendsForDay = useCallback(async (dateObj) => {
        const dateStr = moment(dateObj).format("DD-MM-YYYY");
        const spendsRef = collection(db, "dailySpends", dateStr, "spends");
        const snapshot = await getDocs(spendsRef);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ref: doc.ref,
            ...doc.data(),
        }));
    }, []);

    // Fetch all spends for month (in parallel)
    const fetchMonthlySpends = useCallback(async (monthObj) => {
        const promises = [];
        for (let d = 1; d <= daysInMonth; d++) {
            let dateStr = moment(monthObj).date(d).format("DD-MM-YYYY");
            const spendsRef = collection(db, "dailySpends", dateStr, "spends");
            promises.push(
                getDocs(spendsRef).then(snapshot =>
                    snapshot.docs.map(doc => ({
                        id: doc.id,
                        date: dateStr,
                        ...doc.data(),
                    }))
                )
            );
        }
        const spendsArr = await Promise.all(promises);
        return spendsArr.flat();
    }, [daysInMonth]);

    // Main data loading effect
    useEffect(() => {
        let mounted = true;
        setLoading(true);

        // Load both day and month spends in parallel
        Promise.all([
            fetchSpendsForDay(selectedDate),
            fetchMonthlySpends(selectedDate),
        ]).then(([daySpends, monthSpends]) => {
            if (mounted) {
                setSpendsForDay(daySpends);
                setMonthlySpends(monthSpends);
                setLoading(false);
            }
        });

        return () => { mounted = false };
    }, [selectedDate, user, refresh, fetchSpendsForDay, fetchMonthlySpends]);

    // Chart: day-wise spend for month
    const spendsPerDay = chartCategories.map((dateStr) =>
        monthlySpends
            .filter((spend) => spend.date === dateStr)
            .reduce((sum, spend) => sum + Number(spend.price), 0)
    );
    const chartSeries = [
        {
            name: "Daily Spend",
            data: spendsPerDay,
        },
    ];

    // Total for month
    const monthlyTotal = monthlySpends.reduce((acc, curr) => acc + Number(curr.price), 0);

    // Add spend
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !price) return;
        setLoading(true);
        const dateStr = moment(selectedDate).format("DD-MM-YYYY");
        const spendsRef = collection(db, "dailySpends", dateStr, "spends");
        await addDoc(spendsRef, {
            title,
            price: Number(price),
            submittedBy: user?.email,
            submissionDate: moment().format("DD-MM-YYYY HH:mm:ss"),
        });
        setTitle("");
        setPrice("");
        // Only refresh the minimal required data
        const [daySpends, monthSpends] = await Promise.all([
            fetchSpendsForDay(selectedDate),
            fetchMonthlySpends(selectedDate),
        ]);
        setSpendsForDay(daySpends);
        setMonthlySpends(monthSpends);
        setLoading(false);
    };

    // Edit
    const startEdit = (spend) => {
        setEditingId(spend.id);
        setEditTitle(spend.title);
        setEditPrice(spend.price);
    };
    const cancelEdit = () => {
        setEditingId(null);
        setEditTitle("");
        setEditPrice("");
    };
    const saveEdit = async (spend) => {
        if (!editTitle || !editPrice) return;
        setLoading(true);
        await updateDoc(
            doc(
                db,
                "dailySpends",
                moment(selectedDate).format("DD-MM-YYYY"),
                "spends",
                spend.id
            ),
            {
                title: editTitle,
                price: Number(editPrice),
            }
        );
        cancelEdit();
        // Refresh only what's needed
        const [daySpends, monthSpends] = await Promise.all([
            fetchSpendsForDay(selectedDate),
            fetchMonthlySpends(selectedDate),
        ]);
        setSpendsForDay(daySpends);
        setMonthlySpends(monthSpends);
        setLoading(false);
    };

    // Delete
    const confirmDelete = async (spend) => {
        setLoading(true);
        await deleteDoc(
            doc(
                db,
                "dailySpends",
                moment(selectedDate).format("DD-MM-YYYY"),
                "spends",
                spend.id
            )
        );
        setDeleteId(null);
        // Refresh only what's needed
        const [daySpends, monthSpends] = await Promise.all([
            fetchSpendsForDay(selectedDate),
            fetchMonthlySpends(selectedDate),
        ]);
        setSpendsForDay(daySpends);
        setMonthlySpends(monthSpends);
        setLoading(false);
    };

    // Responsive layout with CSS-in-JS (unchanged from your last version)
    const styles = {
        container: {
            width: "100%",
            fontFamily:
                "system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif",
            minHeight: "100vh",
        },
        header: {
            textAlign: "center",
            padding: "20px 0",
            fontSize: "32px",
            fontWeight: "bold",
        },
        form: {
            background: "#f9f9f9",
            borderRadius: 12,
            padding: "13px 12px 10px",
            boxShadow: "0 1px 6px rgba(52,73,94,0.09)",
            marginBottom: 20,
        },
        input: {
            padding: "10px 11px",
            border: "1.5px solid #e5e7eb",
            borderRadius: 8,
            fontSize: 16,
            outline: "none",
            minWidth: 120,
            marginRight: 0,
            background: "#f3f4f6",
            flex: "1 0 120px",
            boxSizing: "border-box",
            marginBottom: 10,
            width: "100%",
        },
        addBtn: {
            padding: "10px 24px",
            borderRadius: 8,
            // border: "2px solid rgb(49, 49, 49)",
            border: "none",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
            marginLeft: 0,
            marginTop: "0px",
        },
        chartBox: {
            background: "#f9f9f9",
            borderRadius: 10,
            padding: "10px 0 8px",
            margin: "0 0 18px",
            boxShadow: "0 1px 8px rgba(36,40,46,0.04)",
        },
        totalBox: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "10px 0 18px",
            padding: "12px 0",
            borderRadius: 9,
            // background: "linear-gradient(90deg,#bbf7d0 0%,#7dd3fc 100%)",
            background: "#f9f9f9",
            // color: "#065f46",
            fontWeight: 900,
            fontSize: 19,
            letterSpacing: 1,
            boxShadow: "0 1px 10px #7dd3fc19",
        },
        spendsTitle: {
            fontWeight: 700,
            fontSize: 18,
            margin: "10px 0 8px 3px",
            letterSpacing: 0.5,
        },
        spendCard: (idx) => ({
            background: CARD_COLORS[idx % CARD_COLORS.length],
            borderRadius: 12,
            marginBottom: 13,
            padding: "15px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            boxShadow: "0 1px 5px rgba(0,0,0,0.08)",
            flexWrap: "wrap",
            minHeight: 54,
        }),
        spendText: {
            fontWeight: 700,
            fontSize: 16,
            minWidth: 70,
            color: "#0f172a",
        },
        spendAmount: {
            color: "#334155",
            fontWeight: 700,
            fontSize: 16,
            marginLeft: 13,
            letterSpacing: 0.5,
        },
        iconBtn: {
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#374151",
            padding: 6,
            fontSize: 20,
            marginLeft: 7,
        },
        datePicker: {},
        // Responsive section
        "@media screen and (max-width: 700px)": {
            container: {
                maxWidth: "100%",
                // padding: "7vw 2vw",
            },
            header: { fontSize: 24 },
            form: { flexDirection: "column", gap: 9, alignItems: "stretch" },
            input: { minWidth: 0, fontSize: 15 },
            addBtn: { fontSize: 15, width: "100%" },
            spendCard: { padding: "13px 7px" },
        },
    };

    const isMobile = window.innerWidth < 700;
    const mobileStyles = isMobile
        ? {
            ...styles,
            container: { ...styles.container, ...styles["@media screen and (max-width: 700px)"].container },
            header: { ...styles.header, ...styles["@media screen and (max-width: 700px)"].header },
            form: { ...styles.form, ...styles["@media screen and (max-width: 700px)"].form },
            input: { ...styles.input, ...styles["@media screen and (max-width: 700px)"].input },
            addBtn: { ...styles.addBtn, ...styles["@media screen and (max-width: 700px)"].addBtn },
            spendCard: styles.spendCard,
        }
        : styles;

    return (
        <div style={mobileStyles.container}>
            <div style={mobileStyles.header}></div>
            <form onSubmit={handleSubmit} style={mobileStyles.form}>
                <input
                    type="date"
                    value={moment(selectedDate).format("YYYY-MM-DD")}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    style={mobileStyles.input}
                />

                <input
                    type="text"
                    placeholder="Title (e.g., Sugar, Milk)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    style={mobileStyles.input}
                />
                <input
                    type="number"
                    placeholder="Amount"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    style={mobileStyles.input}
                />
                <button type="submit" style={mobileStyles.addBtn}>
                    Add
                </button>
            </form>
            {/* Show Monthly Total */}
            <div style={mobileStyles.totalBox}>
                <span style={{ marginRight: 7, fontSize: 24 }}>💰</span>
                Total for {moment(selectedDate).format("MMMM YYYY")}:
                <span style={{ marginLeft: 8, color: "#0f172a", fontWeight: 900 }}>
                    ₹{monthlyTotal.toLocaleString()}
                </span>
            </div>
            <div style={mobileStyles.chartBox}>
                <StackedColumn
                    options={{
                        chart: { type: "bar", height: 220 },
                        xaxis: { categories: chartCategories },
                        yaxis: {},
                        dataLabels: { enabled: false },
                        legend: { position: "bottom" },
                        tooltip: { y: { formatter: (value) => `₹${value.toLocaleString()}` } },
                        colors: ["#6366f1"],
                        grid: { show: true },
                    }}
                    series={chartSeries}
                />
            </div>
            <div>
                <div style={mobileStyles.spendsTitle}>
                    Spends for {moment(selectedDate).format("DD-MM-YYYY")}
                </div>
                {loading ? (
                    <LoadingSpinner />
                ) : spendsForDay.length === 0 ? (
                    <div style={{ color: "#64748b", fontWeight: 500, padding: 18 }}>
                        No spends for this date.
                    </div>
                ) : (
                    spendsForDay.map((spend, idx) => (
                        <div key={spend.id} style={mobileStyles.spendCard(idx)}>
                            {editingId === spend.id ? (
                                <>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        style={{ ...mobileStyles.input, minWidth: 70, marginBottom: 5, background: "#f1f5f9" }}
                                    />
                                    <input
                                        type="number"
                                        value={editPrice}
                                        onChange={(e) => setEditPrice(e.target.value)}
                                        style={{ ...mobileStyles.input, width: 70, background: "#f1f5f9" }}
                                    />
                                    <button
                                        onClick={() => saveEdit(spend)}
                                        title="Save"
                                        style={{ ...mobileStyles.iconBtn, color: "#16a34a" }}
                                        type="button"
                                    >
                                        <FaCheck size={18} />
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        title="Cancel"
                                        style={{ ...mobileStyles.iconBtn, color: "#ef4444" }}
                                        type="button"
                                    >
                                        <FaTimes size={18} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span style={mobileStyles.spendText}>{spend.title}</span>
                                    <span style={mobileStyles.spendAmount}>₹{spend.price}</span>
                                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
                                        <button
                                            onClick={() => startEdit(spend)}
                                            title="Edit"
                                            style={mobileStyles.iconBtn}
                                            type="button"
                                        >
                                            <FaEdit color="#6366f1" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(spend.id)}
                                            title="Delete"
                                            style={mobileStyles.iconBtn}
                                            type="button"
                                        >
                                            <FaTrash color="#ef4444" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
                {/* Delete Confirmation */}
                {deleteId && (
                    <div
                        style={{
                            background: "#fff1f2",
                            color: "#be123c",
                            fontWeight: 600,
                            padding: 12,
                            borderRadius: 8,
                            margin: "16px 0",
                            textAlign: "center",
                            boxShadow: "0 1px 5px #fda4af22",
                            zIndex: 9,
                            position: "relative"
                        }}
                    >
                        Are you sure you want to delete this spend?
                        <div style={{ marginTop: 10 }}>
                            <button
                                onClick={() => confirmDelete({ id: deleteId })}
                                style={{
                                    padding: "9px 22px",
                                    fontWeight: 700,
                                    borderRadius: 8,
                                    background: "linear-gradient(90deg,#ef4444 0%,#facc15 100%)",
                                    color: "#fff",
                                    marginRight: 10,
                                    fontSize: 15,
                                    border: "none",
                                }}
                            >
                                Yes, Delete
                            </button>
                            <button
                                onClick={() => setDeleteId(null)}
                                style={{
                                    padding: "9px 22px",
                                    fontWeight: 700,
                                    borderRadius: 8,
                                    background: "linear-gradient(90deg,#d1fae5 0%,#bae6fd 100%)",
                                    color: "#1e293b",
                                    fontSize: 15,
                                    border: "none",
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailySpends;
