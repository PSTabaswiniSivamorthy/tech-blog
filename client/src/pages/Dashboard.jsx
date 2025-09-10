import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../context/userContext";
import axios from "axios";
import Loader from "./Loader.jsx";
import DeletePosts from "./DeletePosts.jsx";

const Dashboard = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { id } = useParams();
  const { currentUser } = useContext(UserContext);
  const token = currentUser?.token;

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/posts/users/${id}`,
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPosts(response.data);
      } catch (error) {
        console.error(
          "Error fetching posts:",
          error.response?.data || error.message
        );
      }
      setIsLoading(false);
    };

    fetchPosts();
  }, [id, token]);

  if (isLoading) return <Loader />;

  return (
    <section className="dashboard">
      {posts.length ? (
        <div className="container dashboard__container">
          {posts.map((post) => (
            <article key={post._id} className="dashboard__post">
              <div className="dashboard__post-info">
                <div className="dashboard__post-thumbnail">
                  <img
                    src={`${process.env.REACT_APP_ASSETS_URL}/uploads/${post.thumbnail}`}
                    alt={post.title}
                  />
                </div>
                <h5 className="dashboard__post-ititle">{post.title}</h5>
              </div>
              <div className="dashboard__post-action">
                <Link to={`/posts/${post._id}`} className="btn sm">
                  View
                </Link>
                <Link to={`/posts/${post._id}/edit`} className="btn sm primary">
                  Edit
                </Link>
                <DeletePosts postId={post._id} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <h2>You haven't written any posts</h2>
      )}
    </section>
  );
};

export default Dashboard;
