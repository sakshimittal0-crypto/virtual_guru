import { useState } from "react";
import BottomNav from "./components/BottomNav.jsx";
import Practice from "./screens/Practice.jsx";
import Coach from "./screens/Coach.jsx";
import Guides from "./screens/Guides.jsx";

// Three screens only, per the v1 spec: Practice / Coach / Guides.
// Plain local-state tab switching for now — swap for react-router if
// screens grow sub-routes later.
const SCREENS = {
  practice: Practice,
  coach: Coach,
  guides: Guides,
};

export default function App() {
  const [tab, setTab] = useState("practice");
  const ActiveScreen = SCREENS[tab];

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 overflow-y-auto pb-20">
        <ActiveScreen />
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
