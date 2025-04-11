import React, { useState, useEffect } from "react";
import axios from "axios"; // Ensure axios is imported
import Loader from "../pages/Loader";
import PostItem from "../components/PostItem";

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/posts`
        );
        setPosts(response.data);
      } catch (err) {
        console.log(err);
      }
      setIsLoading(false); // Ensure loading state is reset
    };
    fetchPosts();
  }, []); // Correct dependency array

  if (isLoading) {
    return <Loader />;
  }

  return (
    <section className="posts">
      {posts.length > 0 ? (
        <div className="container posts__container">
          {posts.map(
            ({ _id:id, thumbnail, category, title, description,creator,createdAt }) => (
              <PostItem
                key={id}
                postID={id}
                thumbnail={thumbnail}
                category={category}
                title={title}
                desc={description}
                authorID={creator}
                createdAt={createdAt}
              />
            )
          )}
        </div>
      ) : (
        <h2 className="center">No Posts Found</h2>
      )}
    </section>
  );
};

export default Posts;
