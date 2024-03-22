import Link from "next/link"
import './style.css'



export default function Home() {
  return ( 
    <main className="main">
      <div className="container">
        <div className="content">
          <div className="image-container">
          <img src="./quizify.jpg" alt="Golf Image" />
        
          </div>
          <div className="title-container">
            <h2 className="title">Quizify</h2>
          </div>
          <div className="buttons">
            <div>
              <button className="sign-in"><a href="/api/auth/signup">Sign In</a></button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

