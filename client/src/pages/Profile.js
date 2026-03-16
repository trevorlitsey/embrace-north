// File: src/pages/Profile.js
import React from "react";
import { useAuth } from "../context/AuthContext";
import NotificationSettings from "../components/NotificationSettings";

const Profile = () => {
  const { updateProfile, user } = useAuth();

  return (
    <div className="profile-container">
      <h1>Profile</h1>
      <div className="user-info">
        <h2>Username: {user.username}</h2>
      </div>
      <NotificationSettings user={user} updateProfile={updateProfile} />
    </div>
  );
};

export default Profile;
