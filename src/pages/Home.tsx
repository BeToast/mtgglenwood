import "./Home.css";

function Home() {
   return (
      <div className="page home-page">
         <div className="home-content">
            <h1>MTG Glenwood</h1>
            <h2>Getting Started</h2>
            <p><strong>1.</strong> Venmo Curtis $20 <strong>@curtismcgurtis</strong></p>
            <p><strong>2.</strong> Press 🪞 to create an account and add a deck.</p>
            <p>
               <strong>3.</strong> Press 🎴 to view or log an IRL best-of-3 Value Vintage
               match. Once you log a match, your opponent must log in and
               approve it. Upon approval, the winner is awarded 3pts and the
               loser 1pt.
            </p>
            <p>
               <strong>4.</strong> Press 📅 to view the Match Periods. You are able to log{" "}
               <strong>6 matches per week</strong> broken into two Match
               Periods one on Tuesday night and another for the rest of the week - meet up and get some games outside of Tuesdays!!!
            </p>
            <p><strong>5.</strong> Press 🪜 to view the ladder!</p>
            <p>At the end of the League, prizes will be awared for 1st, 2nd, and 3rd place!</p>
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
