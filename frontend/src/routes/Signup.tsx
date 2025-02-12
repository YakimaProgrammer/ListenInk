import { NavLink } from "react-router"

export function Signup() {
    return <div>
      <h1>Signup Page: </h1>
      <label>First Name: </label>
      <input type="text"></input>
      <label>Last Name: </label>
      <input type="text"></input>
      <label>Email: </label>
      <input type="text"></input>
      <label>Username: </label>
      <input type="text"></input>
      <label>Password: </label>
      <input type="text"></input>
      <label>Retype Password: </label>
      <input type="text"></input>

      <div>
      <NavLink to="/" style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}>
            Homepage
    </NavLink>
      </div>
    </div>
  }
  