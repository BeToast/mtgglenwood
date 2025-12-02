import "./Home.css";

function Home() {
   return (
      <div className="page home-page">
         <div className="home-content">
            <h1>MTG Glenwood</h1>
            <h2>Getting Started</h2>
            <p>First, press 🪞 to create an account and add a deck.</p>
            <p>
               Second, press 🎴 to view or log an IRL best-of-3 Value Vintage
               match. Once you log a match, your opponent must log in and
               approve it. Upon approval, the winner is awarded 3pts and the
               loser 1pt.
            </p>
            <p>
               Third, Press 📅 to view the Match Periods. You are able to log{" "}
               <strong>6 matches per week</strong> broken into two Match
               Periods.
            </p>
            <p>Fourth, press 🪜 to view the ladder!</p>
            <br />
            <p>
               If you have any comments or concerns, please throw eggs at
               Curtis.
            </p>
            <div className="cat-image-container">
               <img
                  src="/wizardCat.png"
                  alt="Wizard Cat"
                  className="cat-image"
               />
            </div>
         </div>
      </div>
   );
}

export default Home;
