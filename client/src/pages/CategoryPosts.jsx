import React, { useState, useEffect } from "react";
import { DUMMY_POSTS } from "../data";
import PostItem from "../components/PostItem";

const CategoryPosts = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    console.log("DUMMY_POSTS:", DUMMY_POSTS);
    setPosts(DUMMY_POSTS);
  }, []);

  useEffect(() => {
    console.log("Posts state:", posts); // Log the posts state whenever it changes
  }, [posts]);

  return (
    <section className="category-posts">
      {posts.length > 0 ? (
        <div className="container category-posts__container">
          {posts.map(({ id, thumbnail, category, title, desc, authorID }) => (
            <PostItem
              key={id}
              postID={id}
              thumbnail={thumbnail}
              category={category}
              title={title}
              desc={desc}
              authorID={authorID}
            />
          ))}
        </div>
      ) : (
        <h2 className="center">No Posts Found</h2>
      )}
    </section>
  );
};

export default CategoryPosts;
