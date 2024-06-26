import React, {useEffect} from "react";
import { Link, NavLink } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import LandingImage from "../../assets/img/landing.svg";
import "./Landing.css"

const Landing = ()=>{
    return(
        <div>
            <Navbar/>
            <div  className="LandingContainer">
                <img src={LandingImage} alt="landing" className="landingImage"/>
                <p className="landingPara">Employee collaboration system, SignIn to start</p>
            </div>
        </div>
    )
}
export default Landing;