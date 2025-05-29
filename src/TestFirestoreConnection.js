import React, { useState, useEffect } from "react";
import { db, doc, getDoc } from "./firebase";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const TestFirestoreConnection = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState({});
  const [user, setUser] = useState(null);

  const shops = ["The Juice Hut", "Bubble Tea N Cotton Candy", "Coffee N Candy"]; // List of shop names

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log("user", currentUser);
        setUser(currentUser);
      } else {
        console.log("No user is signed in");
      }
    });
  }, []);

  const fetchData = async () => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    const formattedDate = selectedDate.toISOString().split("T")[0].split("-").reverse().join("-"); // Format date as DD-MM-YYYY

    try {
      console.log("Fetching data for date:", formattedDate);

      const allData = {};
      for (const shopName of shops) {
        console.log(`Fetching data for shop: ${shopName}`);

        // Create a reference to the specific document
        const docRef = doc(db, "shops", shopName, formattedDate, "data");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          console.log(`Document data for ${shopName}:`, docSnap.data());
          allData[shopName] = docSnap.data();
        } else {
          console.log(`No data for ${shopName} on ${formattedDate}`);
          allData[shopName] = null;
        }
      }

      setData(allData);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  useEffect(() => {
    fetchData(); // Fetch data when the selected date changes
  }, [selectedDate, user]);

  const containerStyles = {
    padding: "20px",
    maxWidth: "100%",
    boxSizing: "border-box",
  };

  const headerStyles = {
    backgroundColor: "#f2f2f2",
    padding: "10px",
    fontSize: "1.2em",
  };

  const datePickerContainerStyles = {
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  };

  const datePickerLabelStyles = {
    marginBottom: "10px",
  };

  const tableStyles = {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "20px",
  };

  const thStyles = {
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "8px",
    textAlign: "left",
    fontSize: "1em",
  };

  const tdStyles = {
    padding: "8px",
    borderBottom: "1px solid #ddd",
    fontSize: "0.9em",
    wordBreak: "break-word", // Ensures content wraps nicely on smaller screens
  };

  const orderedFields = [
    "shopName",
    "upi",
    "card",
    "notes500",
    "notes200",
    "notes100",
    "notes50",
    "notes20",
    "notes10",
    "counterCash",
    "expenses",
    "cash",
    "totalSale",
    "posSale",
    "remaining",
    "cashGiven",
    "submissionDate",
    "submittedBy",
  ];
  const adjustedDate = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000);
  return (
    <div style={containerStyles}>
      <h2>Fetch Data for All Shops</h2>
      <div style={datePickerContainerStyles}>
        <label style={datePickerLabelStyles}>Select Date: </label>
        <DatePicker
          selected={new Date(selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000)}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="dd-MM-yyyy"
        />

      </div>
      <div>
        {/* <h3>Data for {adjustedDate.toDateString()}:</h3> */}
        {Object.keys(data).length > 0 ? (
          Object.keys(data).map((shopName) => (
            <div key={shopName} style={{ marginBottom: "30px" }}>
              <h4 style={headerStyles}>{shopName}</h4>
              {data[shopName] ? (
                <table style={tableStyles}>
                  <thead>
                    <tr>
                      <th style={thStyles}>Field</th>
                      <th style={thStyles}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderedFields.map((key) => (
                      <tr key={key}>
                        <td style={tdStyles}>{key}</td>
                        <td style={tdStyles}>{data[shopName][key] || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No data available for this date.</p>
              )}
            </div>
          ))
        ) : (
          <p>No data available for the selected date.</p>
        )}
      </div>
    </div>
  );
};

export default TestFirestoreConnection;
