import React, { useState } from "react";
import { db, doc, setDoc } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import './DataSubmission.css';
import ToastHandler from "./components/common/ToastHandler";

const DataSubmission = ({ shopName }) => {
  const [data, setData] = useState({
    upi: "",
    card: "",
    notes500: "",
    notes200: "",
    notes100: "",
    notes50: "",
    notes20: "",
    notes10: "",
    cash: "",
    totalSale: "",
    posSale: "",
    remaining: "",
    cashGiven: "",
    counterCash: "",
    expenses: "",  // New field added
  });
  const [errors, setErrors] = useState({});
  const [user] = useAuthState(auth);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prevData) => {
      const newData = { ...prevData, [name]: value };

      // Calculate the total amount for notes
      const notes500Amount = (parseInt(newData.notes500) || 0) * 500;
      const notes200Amount = (parseInt(newData.notes200) || 0) * 200;
      const notes100Amount = (parseInt(newData.notes100) || 0) * 100;
      const notes50Amount = (parseInt(newData.notes50) || 0) * 50;
      const notes20Amount = (parseInt(newData.notes20) || 0) * 20;
      const notes10Amount = (parseInt(newData.notes10) || 0) * 10;

      // Calculate the cash field based on the notes entered and add expenses
      const totalCash = (
        notes500Amount +
        notes200Amount +
        notes100Amount +
        notes50Amount +
        notes20Amount +
        notes10Amount +
        (parseFloat(newData.expenses) || 0)  // Add expenses to cash
      );

      // Subtract counter cash from cash
      newData.cash = totalCash - (parseFloat(newData.counterCash) || 0);

      // Automatically calculate the total sale
      const upi = parseFloat(newData.upi) || 0;
      const card = parseFloat(newData.card) || 0;
      const cash = parseFloat(newData.cash) || 0;
      newData.totalSale = (upi + card + cash);

      // Automatically calculate the remaining amount
      if (name === "posSale" || name === "totalSale") {
        const totalSale = parseFloat(newData.totalSale) || 0;
        const posSale = parseFloat(newData.posSale) || 0;
        newData.remaining = (totalSale - posSale);
      }

      return newData;
    });

    setErrors({ ...errors, [name]: "" }); // Clear error for the field
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    const formattedDate = moment(selectedDate).format("DD-MM-YYYY");
    const formattedSubmissionDate = moment().format("DD-MM-YYYY HH:mm:ss");

    // Validate the form
    let valid = true;
    let newErrors = {};
    for (let key in data) {
      if (data[key] === "" && key !== "notes500" && key !== "notes200" && key !== "notes100" && key !== "notes50" && key !== "notes20" && key !== "notes10") {
        newErrors[key] = "This field is required";
        valid = false;
      }
    }
    setErrors(newErrors);

    if (!valid) {
      console.error("Validation failed");
      return;
    }

    try {
      // Reference to the document for the given date (using a consistent document ID)
      const docRef = doc(db, "shops", shopName, formattedDate, "data");

      // Set the document, replacing any existing data
      await setDoc(docRef, {
        ...data,
        shopName,
        submissionDate: formattedSubmissionDate,
        submittedBy: user.email,
      });

      // Reset the form
      setData({
        upi: "",
        card: "",
        notes500: "",
        notes200: "",
        notes100: "",
        notes50: "",
        notes20: "",
        notes10: "",
        cash: "",
        totalSale: "",
        posSale: "",
        remaining: "",
        cashGiven: "",
        counterCash: "",
        expenses: "",  // Reset new field
      });
      setErrors({});
      setSelectedDate(new Date());

      // Display success message
      ToastHandler.success("Data submitted successfully!");

      // Navigate back to the shop selection after a short delay
      setTimeout(() => {
        navigate("/shopSelection");
      }, 1000);
    } catch (error) {
      console.error("Error setting document: ", error);
      ToastHandler.error("Failed to submit data. Please try again.");
    }
  };

  return (
    <>
      <div className="data-title">{shopName}</div>
      <div className="data-submission">
        <form onSubmit={handleSubmit} className="data-form">

          <div className="input-container">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              className="inputbox"
              value={moment(selectedDate).format("YYYY-MM-DD")}
              onChange={(e) => handleDateChange(new Date(e.target.value))}
            />
          </div>


          <div className="input-container">
            <label htmlFor="upi">UPI</label>
            <input
              className="inputbox"
              type="number"
              id="upi"
              name="upi"
              placeholder="Enter UPI amount"
              value={data.upi}
              onChange={handleChange}
            />
            {errors.upi && <div className="error">{errors.upi}</div>}
          </div>

          <div className="input-container">
            <label htmlFor="card">Card</label>
            <input
              className="inputbox"
              type="number"
              id="card"
              name="card"
              placeholder="Enter Card amount"
              value={data.card}
              onChange={handleChange}
            />
            {errors.card && <div className="error">{errors.card}</div>}
          </div>

          <div className="input-container">
            <label htmlFor="notes500">500 Notes</label>
            <input
              className="inputbox"
              type="number"
              id="notes500"
              name="notes500"
              placeholder="Number of 500 Notes"
              value={data.notes500}
              onChange={handleChange}
            />
            {errors.notes500 && <div className="error">{errors.notes500}</div>}
          </div>

          <div className="input-container">
            <label htmlFor="notes200">200 Notes</label>
            <input
              className="inputbox"
              type="number"
              id="notes200"
              name="notes200"
              placeholder="Number of 200 Notes"
              value={data.notes200}
              onChange={handleChange}
            />
            {errors.notes200 && <div className="error">{errors.notes200}</div>}
          </div>

          <div className="input-container">
            <label htmlFor="notes100">100 Notes</label>
            <input
              className="inputbox"
              type="number"
              id="notes100"
              name="notes100"
              placeholder="Number of 100 Notes"
              value={data.notes100}
              onChange={handleChange}
            />
            {errors.notes100 && <div className="error">{errors.notes100}</div>}
          </div>

          <div className="input-container">
            <label htmlFor="notes50">50 Notes</label>
            <input
              className="inputbox"
              type="number"
              id="notes50"
              name="notes50"
              placeholder="Number of 50 Notes"
              value={data.notes50}
              onChange={handleChange}
            />
            {errors.notes50 && <div className="error">{errors.notes50}</div>}
          </div>

          <div className="input-container">
            <label htmlFor="notes20">20 Notes</label>
            <input
              className="inputbox"
              type="number"
              id="notes20"
              name="notes20"
              placeholder="Number of 20 Notes"
              value={data.notes20}
              onChange={handleChange}
            />
            {errors.notes20 && <div className="error">{errors.notes20}</div>}
          </div>

          <div className="input-container">
            <label htmlFor="notes10">10 Notes</label>
            <input
              className="inputbox"
              type="number"
              id="notes10"
              name="notes10"
              placeholder="Number of 10 Notes"
              value={data.notes10}
              onChange={handleChange}
            />
            {errors.notes10 && <div className="error">{errors.notes10}</div>}
          </div>

          <div className="input-container">
            <label htmlFor="expenses">Expenses</label>
            <input
              className="inputbox"
              type="number"
              id="expenses"
              name="expenses"
              placeholder="Enter Expenses amount"
              value={data.expenses}
              onChange={handleChange}
            />
            {errors.expenses && <div className="error">{errors.expenses}</div>}
          </div>

          <div className="input-container">
            <label htmlFor="counterCash">Counter Cash</label>
            <input
              className="inputbox"
              type="number"
              id="counterCash"
              name="counterCash"
              placeholder="Enter Counter Cash amount"
              value={data.counterCash}
              onChange={handleChange}
            />
            {errors.counterCash && <div className="error">{errors.counterCash}</div>}
          </div>

          <div className="input-container">
            <label htmlFor="cash">Cash</label>
            <input
              className="inputbox"
              type="number"
              id="cash"
              name="cash"
              placeholder="Cash Sales"
              value={data.cash}
              readOnly // Make this field read-only
            />
            {errors.cash && <div className="error">{errors.cash}</div>}
          </div>

          <div className="input-container">
            <label htmlFor="totalSale">Total Sale</label>
            <input
              className="inputbox"
              type="number"
              id="totalSale"
              name="totalSale"
              placeholder="Total Sales"
              value={data.totalSale}
              readOnly // Make this field read-only
            />
            {errors.totalSale && <div className="error">{errors.totalSale}</div>}
          </div>

          <div className="input-container">
            <label htmlFor="posSale">POS Sale</label>
            <input
              className="inputbox"
              type="number"
              id="posSale"
              name="posSale"
              placeholder="Enter POS Sale amount"
              value={data.posSale}
              onChange={handleChange}
            />
            {errors.posSale && <div className="error">{errors.posSale}</div>}
          </div>

          <div className="input-container">
            <label htmlFor="remaining">Remaining</label>
            <input
              className="inputbox"
              type="number"
              id="remaining"
              name="remaining"
              placeholder="Remaining"
              value={data.remaining}
              readOnly // Make this field read-only
            />
            {errors.remaining && <div className="error">{errors.remaining}</div>}
          </div>

          <div className="input-container">
            <label htmlFor="cashGiven">Cash Given</label>
            <input
              className="inputbox"
              type="number"
              id="cashGiven"
              name="cashGiven"
              placeholder="Enter Cash Given amount"
              value={data.cashGiven}
              onChange={handleChange}
            />
            {errors.cashGiven && <div className="error">{errors.cashGiven}</div>}
          </div>

          <button type="submit" className="submit-btn">Submit</button>
        </form>
      </div>
    </>
  );
};

export default DataSubmission;
