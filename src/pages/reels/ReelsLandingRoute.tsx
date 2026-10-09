import { useLocation } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import ReelsLandingPage from "@/pages/reels/ReelsLandingPage";
import { getReelsLandingByPath } from "@/data/reelsLandingPages";

const ReelsLandingRoute = () => {
  const { pathname } = useLocation();
  const config = getReelsLandingByPath(pathname);

  if (!config) {
    return <NotFound />;
  }

  return <ReelsLandingPage config={config} />;
};

export default ReelsLandingRoute;
