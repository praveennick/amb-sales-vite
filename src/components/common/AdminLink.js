
import React from "react";
import { adminEmails } from "../../adminEmails";

const AdminLink = ({ user, children }) => {
    if (!user || !adminEmails.includes(user.email)) {
        return null;
    }

    return <>{children}</>;
};

export default AdminLink;
