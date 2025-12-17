import { NavLink } from "react-router-dom";

export default function BottomNav() {
  return (
    <nav style={styles.nav}>
      <NavLink to="/home">Home</NavLink>
      <NavLink to="/budget">Budget</NavLink>
      <NavLink to="/inventory">Inventory</NavLink>
      <NavLink to="/contractor">Contractor</NavLink>
    </nav>
  );
}

const styles = {
  nav: {
    height: "64px",
    borderTop: "1px solid #222",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center"
  }
};
