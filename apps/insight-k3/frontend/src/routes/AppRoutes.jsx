import { 
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";


import MainLayout from "../layouts/MainLayout";


import Dashboard from "../pages/Dashboard/Dashboard";
import Incident from "../pages/Incident/Incident";
import IncidentDetail from "../pages/Incident/IncidentDetail";

import Report from "../pages/Report/Report";
import Analytics from "../pages/Analytics/Analytics";
import MasterData from "../pages/MasterData/MasterData";
import UserManagement from "../pages/UserManagement/UserManagement";
import Settings from "../pages/Settings/Settings";



function AppRoutes(){


return(


<BrowserRouter>


<Routes>



<Route
path="/"
element={<MainLayout/>}
/>



<Route
path="/dashboard"
element={<Dashboard/>}
/>



<Route
path="/incident"
element={<Incident/>}
/>



<Route
path="/incident/:id"
element={<IncidentDetail/>}
/>



<Route
path="/report"
element={<Report/>}
/>



<Route
path="/analytics"
element={<Analytics/>}
/>



<Route
path="/master-data"
element={<MasterData/>}
/>



<Route
path="/users"
element={<UserManagement/>}
/>



<Route
path="/settings"
element={<Settings/>}
/>



</Routes>


</BrowserRouter>


)


}


export default AppRoutes;