import React, { useState, useContext, useEffect } from "react";
import { DUMMY_POSTS } from "../data.js";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { UserContext } from "../context/userContext"; // Added UserContext

const Dashboard = () => {
  const [posts, setPosts] = useState(DUMMY_POSTS);
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
    <section className="dashboard">
      {posts.length ? (
        <div className="container dashboard__container">
          {posts.map((post) => {
            return (
              <article key={post.id} className="dashboard__post">
                <div className="dashboard__post-info">
                  <div className="dashboard__post-thumbnail">
                    <img src={post.thumbnail} alt="" />
                  </div>
                  <h5>{post.title}</h5>
                </div>
                <div className="dashboard__post-action">
                  <Link to={`/posts/${post.id}`} className="btn sm">
                    View
                  </Link>
                  <Link
                    to={`/posts/${post.id}/edit`}
                    className="btn sm primary"
                  >
                    Edit
                  </Link>
                  <Link to={`/posts/${post.id}`} className="btn sm danger">
                    Delete
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <h2>You haven't written any posts</h2>
      )}
    </section>
  );
};

export default Dashboard;
