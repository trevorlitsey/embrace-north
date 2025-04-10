// File: src/pages/Profile.js
import React from "react";
import { useAuth } from "../context/AuthContext";
import NotificationSettings from "../components/NotificationSettings";
import PasswordChange from "../components/PasswordChange";

const Profile = () => {
  const { updateProfile, user } = useAuth();
  console.log("1", { user });
  console.log("2", user.username);

  return (
    <div className="profile-container">
      <h1>Profile</h1>
      <div className="user-info">
        <h2>Username: {user.username}</h2>
      </div>
      <NotificationSettings user={user} updateProfile={updateProfile} />
      <PasswordChange updateProfile={updateProfile} />
    </div>
  );
};

export default Profile;
