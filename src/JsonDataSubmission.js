import React, { useEffect } from "react";
import { db, doc, setDoc } from "./firebase";
import jsonData from "./csvjson.json"; // Import the JSON data
import moment from "moment";
import ToastHandler from "./components/common/ToastHandler";

const JsonDataSubmission = () => {

    // Function to calculate the required fields
    const calculateFields = (data) => {
        const notes500Amount = (parseInt(data.notes500) || 0) * 500;
        const notes200Amount = (parseInt(data.notes200) || 0) * 200;
        const notes100Amount = (parseInt(data.notes100) || 0) * 100;
        const notes50Amount = (parseInt(data.notes50) || 0) * 50;
        const notes20Amount = (parseInt(data.notes20) || 0) * 20;
        const notes10Amount = (parseInt(data.notes10) || 0) * 10;

        const totalCash = (
            notes500Amount +
            notes200Amount +
            notes100Amount +
            notes50Amount +
            notes20Amount +
            notes10Amount +
            (parseFloat(data.expenses) || 0)
        );

        const cash = totalCash - (parseFloat(data.counterCash) || 0);
        const upi = parseFloat(data.upi) || 0;
        const card = parseFloat(data.card) || 0;
        const totalSale = (upi + card + cash);
        const posSale = parseFloat(data.posSale) || 0;
        const remaining = (totalSale - posSale);

        return {
            cash,
            totalSale,
            remaining,
            upi,
            card,
            expenses: data.expenses,
            counterCash: data.counterCash,
            cashGiven: data.cashGiven,
            notes500: data.notes500,
            notes200: data.notes200,
            notes100: data.notes100,
            notes50: data.notes50,
            notes20: data.notes20,
            notes10: data.notes10,
            posSale: data.posSale,
        };
    };

    const handleSubmit = async () => {
        for (const row of jsonData) {
            const formattedDate = moment(row.Date, "DD-MM-YYYY").format("DD-MM-YYYY");
            const formattedSubmissionDate = moment(row.submissionDate, "YYYY-MM-DD HH:mm:ss").format("DD-MM-YYYY HH:mm:ss");

            const calculatedData = calculateFields(row);

            try {
                const docRef = doc(db, "shops", row.shopName, formattedDate, "data");

                await setDoc(docRef, {
                    ...calculatedData,
                    shopName: row.shopName,
                    submissionDate: formattedSubmissionDate,
                    submittedBy: row.submittedBy,
                });

                console.log(`Data for ${row.shopName} on ${formattedDate} updated successfully.`);
                ToastHandler.success("Data submitted successfully!");
            } catch (error) {
                console.error(`Error updating data for ${row.shopName} on ${formattedDate}:`, error);
                ToastHandler.error("Failed to submit data. Please try again.");
            }
        }
    };


    // useEffect to trigger the submission process when the component mounts
    useEffect(() => {
        handleSubmit();
    }, []);

    return (
        <div>
            <h3>Submitting JSON data to Firebase...</h3>
        </div>
    );
};

export default JsonDataSubmission;
