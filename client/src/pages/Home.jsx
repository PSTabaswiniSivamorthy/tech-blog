import React from "react";
import Posts from "../components/Posts";
import { Link } from "react-router-dom";
import { UserContext } from "../context/userContext";

const Home = () => {
  const { currentUser } = React.useContext(UserContext);

  return (
    <>
      <section className="home__hero">
        <div className="container home__hero-container">
          <p className="home__kicker">Build. Share. Grow.</p>
          <h1>Discover practical tech articles from developers like you.</h1>
          <p className="home__lead">
            Explore coding stories, project breakdowns, interview prep, and
            trending tools in one focused learning hub.
          </p>
          <div className="home__actions">
            {currentUser?.id ? (
              <>
                <Link to="/create" className="btn primary">
                  Write with AI
                </Link>
                <Link to={`/myposts/${currentUser.id}`} className="btn">
                  Open Dashboard
                </Link>
                <Link to="/notifications" className="btn">
                  View Notifications
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn primary">
                  Get Started
                </Link>
                <Link to="/login" className="btn">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
      <Posts />
    </>
  );
};

export default Home;
