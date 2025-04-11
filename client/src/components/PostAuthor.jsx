import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const PostAuthor = ({ authorID, createdAt }) => {
  const [author, setAuthor] = useState({});

  useEffect(() => {
    const getAuthor = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/${authorID}`);
        setAuthor(response?.data);
      } catch (error) {
        console.error("Error fetching author:", error);
      }
    };
    getAuthor();
  }, [authorID]);

  return (
    <Link to={`/posts/users/${authorID}`} className="post__author">
      <div className="post__author-avatar">
        <img 
          src={`${process.env.REACT_APP_ASSETS_URL}/uploads/${author?.avatar}`} 
          alt={author?.name || "Author Avatar"} 
        />
      </div>
      <div className="post__author-details">
        <h5>By: {author?.name || "Unknown Author"}</h5>
        <small>{new Date(createdAt).toLocaleDateString()}</small>
      </div>
    </Link>
  );
};

export default PostAuthor;
