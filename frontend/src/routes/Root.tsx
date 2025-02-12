import { NavLink } from "react-router";


export function Root() {
  return <div>
    <h1>ListenInk</h1>
    <h2>Totally not a scam website!!!</h2>
    <h3>By: Magnus, Sajana, Tario, Simon, and Nhan</h3>
    <h4>Product of UW (University of Washington @ Seattle) NOT UW-Madison</h4>
    <p>With this project, we hope to create an application that users can input a pdf and let it read aloud.</p>

    <NavLink to="/login" style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}>
            Login
    </NavLink>

    <NavLink to="/signup" style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}>
            Signup
    </NavLink>
  </div>
}
