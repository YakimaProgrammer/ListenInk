import { NavLink } from "react-router"

export function Login() {
  return <div>
    <h1>Login Page: </h1>
    <label>Username: </label>
    <input type="text"></input>
    <label>Password: </label>
    <input type="text"></input>

    <div>
    <NavLink to="/" style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}>
            Homepage
    </NavLink>
    </div>
  </div>
}
