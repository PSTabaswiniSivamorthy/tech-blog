import React, { useState, useContext, useEffect } from "react";
import { FaCheck, FaEdit } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/userContext";
import axios from "axios";

const UserProfile = () => {
  const [avatar, setAvatar] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isAvatarTouched, setIsAvatarTouched] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useContext(UserContext);
  const token = currentUser?.token;

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Fetch user profile
  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/users/${currentUser.id}`,
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const {
          name: fetchedName,
          email: fetchedEmail,
          avatar: fetchedAvatar,
        } = response.data;

        setName(fetchedName || "");
        setEmail(fetchedEmail || "");
        setAvatar(fetchedAvatar || null);

        console.log("Profile fetched:", response.data);
      } catch (error) {
        console.error(
          "Error fetching user:",
          error.response?.data || error.message
        );
      }
    };

    if (token && currentUser?.id) {
      getUser();
    }
  }, [token, currentUser?.id]);

  // Handle avatar upload
  const changeAvatarHandler = async () => {
    setIsAvatarTouched(false);
    try {
      const formData = new FormData();
      formData.append("avatar", avatar);

      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/users/change-avatar`,
        formData,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Avatar updated:", response.data);
      setAvatar(response?.data.avatar);
    } catch (error) {
      console.error(
        "Error updating avatar:",
        error.response?.data || error.message
      );
    }
  };

  // Handle profile update (name, email, password)
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const userData = new FormData();
      userData.set("name", name);
      userData.set("email", email);
      userData.set("currentPassword", currentPassword);
      userData.set("newPassword", newPassword);
      userData.set("confirmNewPassword", confirmNewPassword);

      const response = await axios.patch(
        `${process.env.REACT_APP_BASE_URL}/users/edit-user`,
        userData,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Profile updated:", response.data);
      alert("Profile updated successfully!");
      if (response.status == 200) {
        navigate("/logout");
      }
    } catch (error) {
      console.error(
        "Error updating profile:",
        error.response?.data || error.message
      );
      setError(error.response.data.message);
    }
  };

  return (
    <section className="profile">
      <div className="container profile__container">
        <Link to={`/myposts/${currentUser.id}`} className="btn">
          My Posts
        </Link>

        <div className="profile__details">
          {/* Avatar Section */}
          <div className="avatar__wrapper">
            <div className="profile__avatar">
              {avatar ? (
                <img
                  src={`${process.env.REACT_APP_ASSETS_URL}/uploads/${avatar}`}
                  alt="User Avatar"
                />
              ) : (
                <span>No Avatar</span>
              )}
            </div>
            <form className="avatar__form">
              <input
                type="file"
                name="avatar"
                id="avatar"
                onChange={(e) => {
                  setAvatar(e.target.files[0]);
                  setIsAvatarTouched(true);
                }}
                accept="image/png, image/jpeg, image/jpg"
              />
              <label htmlFor="avatar">
                <FaEdit />
              </label>
            </form>
            {isAvatarTouched && (
              <button
                type="button"
                className="profile__avatar-btn"
                onClick={changeAvatarHandler}
              >
                <FaCheck />
              </button>
            )}
          </div>

          {/* User Info */}
          <h1>{name}</h1>
          <p>{email}</p>

          {/* Profile Form */}
          <form className="form profile__form" onSubmit={handleProfileUpdate}>
            {error && <p className="form__error-message">{error}</p>}
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
            <button type="submit" className="btn primary">
              Update Profile
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default UserProfile;
