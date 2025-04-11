import React, {useContext } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/userContext";
const DeletePosts = () => {
  const navigate = useNavigate(); // Correct use of useNavigate
  const { currentUser } = useContext(UserContext); // Correct context import
  const token = currentUser?.token;
  // Redirect to login page for any user who is not logged in
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]); // Added token and navigate as dependencies

  return (
    <div>
      <h1>DeletPost</h1>
    </div>
  );
};

export default DeletePosts;
