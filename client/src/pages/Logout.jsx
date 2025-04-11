import React, { useContext} from "react";
import { UserContext } from "../context/userContext";
import { useNavigate } from "react-router-dom";
const Logout = () => {
  const { setCurrentUser } = useContext(UserContext);
  const navigate = useNavigate();
  setCurrentUser(null);
  navigate("/login");
  return (
    <div>
      <h1>Logout</h1>
    </div>
  );
};

export default Logout;
